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

var Client = require('node-rest-client').Client;
var settings = require("./../../../settings");

var checkProperty = function(object, propertyName){
    if(!object[propertyName] || !(typeof object[propertyName] === 'string' || object[propertyName] instanceof String)){
        throw new Error("protocol config misses property: "+propertyName);
    }
}

module.exports = {
    create: function(config, monitor){
        checkProperty(config, "url");
        checkProperty(config, "method");
        var rest = new Client();
        var client = {
            send: function(value){
                var args = {
                    data: value,
                    headers: config.headers
                };
                var req = rest[config.method.toLowerCase()](config.url, args, function (data, response) {
                    if(monitor){
                        monitor.log("response from data receiver: " + JSON.stringify(data));
                    }
                });
                req.on('requestTimeout', function (req) {
                    console.log('request has expired');
                    req.abort();
                    if(monitor){
                        monitor.error("rest-client request timeout");
                    }
                });

                req.on('responseTimeout', function (res) {
                    console.log('response has expired');
                    if(monitor){
                        monitor.error("rest-client response timeout");
                    }
                });
                req.on('error', function (err) {
                    if(settings.debug){
                        console.log('request error', err);
                    }
                    if(monitor){
                        monitor.error("rest-client connection error");
                    }
                });
            },
            stop: function(){}
        };
        return client;
    }
};