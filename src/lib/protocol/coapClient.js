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

var coap = require('coap');
const URL = require('url');

var checkProperty = function(object, propertyName){
    if(!object[propertyName] || !(typeof object[propertyName] === 'string' || object[propertyName] instanceof String)){
        throw new Error("protocol config misses property: "+propertyName);
    }
};

var coapTiming = {
    ackTimeout:0.25,
    ackRandomFactor: 1.0,
    maxRetransmit: 3,
    maxLatency: 2,
    piggybackReplyMs: 10
};
coap.updateTiming(coapTiming);

module.exports = {
    create: function (config, monitor) {
        checkProperty(config, "url");
        checkProperty(config, "method");
        var client = {
            send: function (value) {
                var url = URL.parse(config.url);
                var request = new coap.request({
                    hostname: url.hostname,
                    port: url.port,
                    method: config.method.toUpperCase(),
                    confirmable: config.confirmable === true,
                    pathname: url.pathname,
                    headers: config.headers
                });
                request.write(value);

                request.on('response', function(res) {
                    if(monitor){
                        monitor.log("response from data receiver: " + res.payload.toString('utf8'));
                    }
                });

                request.on("error", function(err){
                    if(monitor){
                        monitor.error("coap-client connection timeout");
                    }
                });

                request.end();
            },
            stop: function(){}
        };
        return client;
    }
};