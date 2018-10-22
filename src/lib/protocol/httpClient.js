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

var http = require('http');
var URL = require("url");
var settings = require("./../../../settings");

var checkProperty = function(object, propertyName){
    if(!object[propertyName] || !(typeof object[propertyName] === 'string' || object[propertyName] instanceof String)){
        throw new Error("protocol config misses property: "+propertyName);
    }
};

module.exports = {
    create: function(config, monitor){
        checkProperty(config, "url");
        checkProperty(config, "method");
        var client = {
            send: function(value){
                var url = URL.parse(config.url);
                var options = {
                    hostname: url.hostname,
                    port: url.port,
                    path: url.path,
                    method: config.method.toUpperCase(),
                    headers: config.headers
                };

                var req = http.request(options, function(res){
                    res.setEncoding('utf8');
                    res.on('data', function(chunk){
                        if(monitor){
                            monitor.log("response from data receiver: " + chunk);
                        }
                    });
                }); 

                req.on('error', function(e){
                    if(monitor){
                        monitor.error("rest-client connection error: " + e.message);
                    }
                });

                req.write(value);
                req.end();
            },
            stop: function(){}
        };
        return client;
    }
};
