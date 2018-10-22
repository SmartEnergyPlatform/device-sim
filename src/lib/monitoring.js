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

var moment = require("moment");
const WS = require('ws').Server;
var settings = require("./../../settings");
var persistence = require("./persistence").as("log");
var websocket;

var send = function(message, isWsMessage){
    if(settings.debug){
        console.log(message);
    }
    if(isWsMessage === true){
        websocket.clients.forEach(function(client){
            client.send(message);
        });
    }
    if(settings.persistentMonitoring){
        var msg;
        try{
            msg = JSON.parse(message);
        }catch(e){
            msg = message;
        }
        persistence.add({msg: msg});
    }
};

var sendJson = function(msg, isWsMessage){
    send(JSON.stringify(msg), isWsMessage);
};

var createSensorMsg = function(topic, sensor, msg){
    return {deviceType: "sensor", topic: topic, sensorID: sensor.id, msg: msg, time: moment().format("DD.MM.YYYY HH:mm:ss")};
};

function createActuatorMsg(topic, actuator, msg) {
    return {deviceType: "actuator", topic: topic, actuatorID: actuator.id, msg: msg, time: moment().format("DD.MM.YYYY HH:mm:ss")};
}
module.exports  = {
    init: function(server){
        console.log("start ws");
        websocket = new WS({server: server});
    },
    send: send,
    sendJson: sendJson,
    sensor : {
        send: function(sensor, msg){
            sendJson(createSensorMsg("msg_send", sensor, msg), sensor.monitoring);
        },
        error: function(sensor, msg){
            sendJson(createSensorMsg("error", sensor, msg), sensor.monitoring);
        },
        protocol : {
            log: function(sensor, msg){
                sendJson(createSensorMsg("protocol_log", sensor, msg), sensor.monitoring);
            },
            error: function(sensor, msg){
                sendJson(createSensorMsg("protocol_error", sensor, msg), sensor.monitoring);
            }
        }
    },
    actuators:{
        command: function(actuator, payload, msg, state){
            sendJson(createActuatorMsg("command", actuator, {payload:payload, parsed:msg, state:state}), actuator.monitoring);
        },
        error: function(actuator, msg){
            sendJson(createActuatorMsg("error", actuator, msg), actuator.monitoring);
        },
        protocol : {
            log: function(actuator, msg){
                sendJson(createActuatorMsg("protocol_log", actuator, msg), actuator.monitoring);
            },
            error: function(actuator, msg){
                sendJson(createActuatorMsg("protocol_error", actuator, msg), actuator.monitoring);
            }
        }
    }
};