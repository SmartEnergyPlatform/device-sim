/*
 Copyright 2018 InfAI (CC SES)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

var monitoring = require("./monitoring");
var persistence = require("./persistence").as("sensor");
var mustache = require("mustache");
var protocol = require("./protocol/sensorProtocol");
var isolation = require("./isolation");
var isolationID = "sensors";
isolation.init(isolationID);

var sensors = {};

var makeFunction = function(functionStr) {
    return isolation.makeFunction(isolationID, functionStr);
}

function createProtocolMonitorHandler(sensor) {
    return {
        log: function(message){
            monitoring.sensor.protocol.log(sensor, message)
        },
        error: function(message){
            monitoring.sensor.protocol.error(sensor, message)
        }
    };
}

function getProtocol(protocolConf, sensor) {
    return protocol(protocolConf, createProtocolMonitorHandler(sensor));
}


function getMilSecFromInterval(interval) {
    switch(interval.unit){
        case "milliseconds" : return interval.value * 1;
        case "seconds" : return interval.value * 1000;
        case "minutes" : return interval.value * 60000;
        case "hours" : return interval.value * 3600000;
        case "days" : return interval.value * 86400000;
        default: -1;
    }
}

function errorReset(sensor) {
    if(sensor.stop){
        sensor.stop();
    }else{
        if(sensor.protocol && sensor.protocol.stop){
            sensor.protocol.stop();
        }
        sensor.protocol = null;
    }
}


function addTimeToContent(content){
    var date = new Date();
    content.TIME_STAMP = date.getTime();
    content.TIME_UTC = date.toUTCString();
    content.TIME_ISO = date.toISOString();
    content.TIME_STRING = date.toString();
    content.TIME_DATE = date.toDateString();
    content.TIME_TIME = date.toTimeString();
}

// id=string, interval={value, unit}, requestMsgTemplate=string
var createSensor = function(id, interval, requestFormat, contentCreator, protocolConf, displayName, active){
    mustache.parse(requestFormat);
    var sensor = {};
    try {
        sensor.id = id;
        sensor.serializedForm = {id: id, interval: interval, requestFormat: requestFormat, contentCreator: contentCreator, protocolConf: protocolConf, displayName:displayName, active: active};
        if(active){
            sensor.monitoring = false;
            sensor.requestFormat = requestFormat;
            sensor.getRequestContent = makeFunction(contentCreator);
            sensor.protocol = getProtocol(protocolConf, sensor);
            sensor.counter = 0;
            sensor.send = function(){
                try{
                    var msgContent = sensor.getRequestContent(sensor.id, sensor.counter++);
                    addTimeToContent(msgContent);
                    var msg = mustache.render(sensor.requestFormat, msgContent);
                    monitoring.sensor.send(sensor, msg);
                    sensor.protocol.send(msg);
                }catch(e){
                    monitoring.sensor.error(sensor, e.message);
                }
            };
            sensor.timer = false;
            sensor.stop = function(){
                if(sensor.timer){
                    clearInterval(sensor.timer);
                }
                sensor.protocol.stop();
            };
            sensor.start = function(){
                var msInterval = getMilSecFromInterval(interval);
                if(msInterval > -1){
                    sensor.timer = setInterval(sensor.send, msInterval)
                }else{
                    monitoring.sensor.error(sensor, "error in interval format");
                    return "error in interval format"; //error message
                }
            };
        }else{
            sensor.send = function(){};
            sensor.stop = function(){};
            sensor.start = function(){};
        }
    }catch(e){
        errorReset(sensor);
        sensor = {};
        sensor.start = function(){
            console.error(e);
            monitoring.sensor.error(sensor, "error on sensor initialzion: " + e.message);
            return "error on sensor initialzion: " + e.message;
        }
    }
    return sensor;
}

var add = function(sensorMsg){
    if(!sensors[sensorMsg.id]){
        var sensor = createSensor(sensorMsg.id, sensorMsg.interval, sensorMsg.requestFormat, sensorMsg.contentCreator, sensorMsg.protocolConf, sensorMsg.displayName, sensorMsg.active);
        var err = sensor.start();
        if(!err){
            sensors[sensor.id] = sensor;
        }else{
            return err;
        }
    }else{
        return "sensor with id "+sensorMsg.id+" exists already";    // error message
    }
};

var addWithPersistence = function(sensor){
    var err = add(sensor);
    if(!err){
        persistence.add(sensor);
    }
    return err;
};

var remove = function(id){
    if(sensors[id]){
        var sensor = sensors[id];
        sensor.stop();
        delete sensors[id];
        persistence.remove(id);
    }else{
        return "error sonsor with id "+id+" does not exist"; // error message
    }
};

persistence.get(function(sensors){
    console.log("init sensors");
    sensors.forEach(function(sensor){
        try{
            add(sensor);
        }catch(e){
            console.error(e);
        }
    });
});

module.exports = {
    get: function(id){return sensors[id];},
    getAll: function(){return Object.keys(sensors).map(function(key){return sensors[key].serializedForm;})},
    add: addWithPersistence,
    update: function(sensor){
        var err;
        if(sensors[sensor.id]){
            err = remove(sensor.id)
        }
        if(!err){
            err = addWithPersistence(sensor);
        }
        return err;
    },
    remove: remove,
    reset: function (){
        for(key in sensors){
            sensors[key].stop();
        }
        sensors = {};
        persistence.reset();
        isolation.reset(isolationID);
    },
    stop: function(){
        for(key in sensors){
            sensors[key].stop();
        }
        isolation.reset(isolationID);
    }
}