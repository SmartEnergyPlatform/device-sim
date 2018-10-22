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

var rest_server = require("./restServer");
var coap_server = require("./coapServer");
var mqtt_consumer = require("./mqttConsumer");
var mqtt_responsive_consumer = require("./mqttResponsiveConsumer");


var createHandler = function(command, resource){
    return {
        send: function(value){resource.send(value);},
        stop: function(){resource.stop(); command.stop();}
    };
}

module.exports = function(config, handler, monitor){
    if (typeof config === 'string' || config instanceof String){
        config = JSON.parse(config);
    }
    if(!config.type || !(typeof config.type === 'string' || config.type instanceof String)){
        throw new Error("protocol config has no valid 'type' property");
    }
    if(!config.conf){
        throw new Error("protocol config has no 'conf' property");
    }
    switch(config.type){
        case "REST-SERVER":
            var resourceConf = {method: "GET", path: config.conf.path};
            var command = rest_server.createCommand(config.conf, handler);
            var resource = rest_server.createResource(resourceConf, monitor);
            return createHandler(command, resource);
        case "COAP-SERVER":
            var resourceConf = {method: "GET", path: config.conf.path};
            var command = coap_server.createCommand(config.conf, handler);
            var resource = coap_server.createResource(resourceConf, monitor);
            return createHandler(command, resource);
        case "MQTT-CONSUMER": return mqtt_consumer.create(config.conf, handler, monitor);
        case "MQTT-RESPONSIVE-CONSUMER": return mqtt_responsive_consumer.create(config.conf, handler, monitor);
        default:
            throw new Error("unknown protocol "+config.type);
            console.log("unknown protocol "+config.type);
    }
};