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

var http_client = require("./httpClient");
var rest_client = require("./restClient");
var rest_server = require("./restServer");
var coap_client = require("./coapClient");
var coap_server = require("./coapServer");
var mqtt = require("./mqttProducer")


module.exports = function(config, monitor){
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
        case "HTTP-CLIENT": return http_client.create(config.conf, monitor);
        case "REST-CLIENT": return rest_client.create(config.conf, monitor);
        case "MQTT-PRODUCER": return mqtt.create(config.conf, monitor);
        case "REST-SERVER": return rest_server.createResource(config.conf, monitor);
        case "COAP-CLIENT": return coap_client.create(config.conf, monitor);
        case "COAP-SERVER": return coap_server.createResource(config.conf, monitor);
        case "DEBUG": return {send: function(value){console.log(value)}};
        default:
            throw new Error("unknown protocol "+config.type);
            console.log("unknown protocol "+config.type);
    }
};

