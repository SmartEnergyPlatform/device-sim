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

var mqtt = require('mqtt');

var checkProperty = function(object, propertyName){
    if(!object[propertyName] || !(typeof object[propertyName] === 'string' || object[propertyName] instanceof String)){
        throw new Error("protocol config misses property: "+propertyName);
    }
};

var checkPropertyNumber = function(object, propertyName){
    if(isNaN(object[propertyName])){
        throw new Error("protocol config misses property: "+propertyName);
    }
};

module.exports = {
    create: function(config, monitor){
        checkProperty(config, "user");
        checkProperty(config, "pw");
        checkProperty(config, "url");
        checkProperty(config, "topic");
        checkPropertyNumber(config, "qos");
        var con  = mqtt.connect(config.url, {username: config.user, password: config.pw});
        con.on("error", function(err){
            if(monitor){
                monitor.error(err);
            }
        });
        var client = {
            send: function(value){
                con.publish(config.topic, value, {qos:config.qos});
            },
            stop: function(){
                con.end();
            }
        };
        return client;
    },
    stop: function(){}
};