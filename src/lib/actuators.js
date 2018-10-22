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

var monitoring = require("./monitoring").actuators;
var persistence = require("./persistence").as("actuator");
const fs = require('fs');
var path = require('path');
var protocol = require("./protocol/actuatorProtocol");
var isolation = require("./isolation");
var isolationID = "actuators";
isolation.init(isolationID);

var actuators = {};

function createProtocolMonitorHandler(actuator) {
    return {
        log: function(message){
            monitoring.protocol.log(actuator, message)
        },
        error: function(message){
            monitoring.protocol.error(actuator, message)
        }
    };
}

var makeFunction = function(functionStr) {
    return isolation.makeFunction(isolationID, functionStr);
};

var getResponseHandler = function(actuator){
    return function(payload){
        try{
            var msg = actuator.parser(payload);
            var state = getStateObject(actuator.states, msg);
            monitoring.command(actuator, payload, msg, state);
            if(state.adopt){
                actuator.protocol.send(msg); //set resource to value
            }
            return state.response;
        }catch(e){
            monitoring.error(actuator, e.message);
        }
    };
};

function getProtocol(protocolConf, actuator) {
    return protocol(protocolConf, getResponseHandler(actuator), createProtocolMonitorHandler(actuator));
}

function errorReset(actuator) {
    if(actuator.stop){
        actuator.stop();
    }else{
        if(actuator.protocol && actuator.protocol.stop){
            actuator.protocol.stop();
        }
        actuator.protocol = null;
    }
}

var getStateObject = function(states, msg){
    var defaultState = {response: "", adopt: false};
    var result = defaultState;
    for(index=0; index < states.length && result === defaultState; index++){
        var state = states[index];
        var regex = new RegExp(state.regex);
        if(regex.test(msg)){
            result = state;
        }
    }
    return result;
};

function createActuator(id, states, parser, protocolConf, displayName, active) {
    var actuator = {};
    try {
        actuator.id = id;
        actuator.serializedForm = {id: id, states: states, parser: parser, protocolConf: protocolConf, displayName: displayName, active:active};
        if(active){
            actuator.id = id;
            actuator.states = states;
            actuator.parser = makeFunction(parser);
            actuator.start = function () {};
            actuator.protocol = getProtocol(protocolConf, actuator);
            actuator.stop = function () {
                actuator.protocol.stop();
                actuator.protocol = null;
            };
        }else{
            actuator.start = function () {};
            actuator.stop = function () {};
        }
    }catch(e){
        errorReset(actuator);
        actuator = {};
        actuator.start = function(){
            console.error(e);
            return "error on actuator initialzion: " + e.message;
        }
    }
    return actuator;
}

var add = function(actuatorMsg){
    if(!actuators[actuatorMsg.id]){
        var actuator;
        actuator = createActuator(actuatorMsg.id, actuatorMsg.states, actuatorMsg.parser, actuatorMsg.protocolConf, actuatorMsg.displayName, actuatorMsg.active);
        var err = actuator.start();
        if(!err){
            actuators[actuator.id] = actuator;
        }else{
            return err;
        }
    }else{
        return "actuator with id "+actuatorMsg.id+" exists already";    // error message
    }
};

var addWithPersistence = function(actuator){
    var err = add(actuator);
    if(!err){
        persistence.add(actuator);
    }
    return err;
};

var remove = function(id){
    if(actuators[id]){
        var actuator = actuators[id];
        actuator.stop();
        delete actuators[id];
        persistence.remove(id);
    }else{
        return "error actuator with id "+id+" does not exist"; // error message
    }
};

persistence.get(function(actuators){
    console.log("init actuators");
    actuators.forEach(function(actuator){
        try{
            add(actuator);
        }catch(e){
            console.error(e);
        }
    });
});

module.exports = {
    get: function(id){return actuators[id];},
    getAll: function(){return Object.keys(actuators).map(function(key){return actuators[key].serializedForm;})},
    add: addWithPersistence,
    update: function(actuator){
        var err;
        if(actuators[actuator.id]){
            err = remove(actuator.id)
        }
        if(!err){
            err = addWithPersistence(actuator);
        }
        return err;
    },
    remove: remove,
    reset: function (){
        for(key in actuators){
            actuators[key].stop();
        }
        actuators = {};
        persistence.reset();
        isolation.reset(isolationID);
    },
    stop: function(){
        for(key in actuators){
            actuator[key].stop();
        }
        isolation.reset(isolationID);
    }
}