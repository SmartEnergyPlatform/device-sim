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
var URL = require("url");
var settings = require("./../../../settings")

var resources = {
    "get": {},
    "post": {},
    "put": {}
}

var checkProperty = function(object, propertyName){
    if(!object[propertyName] || !(typeof object[propertyName] === 'string' || object[propertyName] instanceof String)){
        throw new Error("protocol config misses property: "+propertyName);
    }
}

var server = coap.createServer();
server.on('request', function(req, res) {
    var method = req.method.toLowerCase();
    var path = URL.parse(req.url).pathname;
    console.log("receive coap request: "+method+" "+path);
    var payload = req.payload.toString('utf8');
    if(resources[method] && resources[method][path]){
        res.write(resources[method][path](payload));
        res.end();
    }else{
        res.statusCode = 404;
        res.write("404");
        res.end();
    }
});

server.listen(settings.coapServer.port);
console.log("coap server on port: ", settings.coapServer.port);


module.exports = {
    createResource: function(config, monitor){
        checkProperty(config, "path");
        checkProperty(config, "method");
        var handler = {
            value: "",
            send: function(value){
                handler.value = value;
            },
            stop: function(){
                delete resources[config.method.toLowerCase()][config.path];
            }
        };
        module.exports.createCommand(config, function(payload){
            if(monitor){
                monitor.log("request to resource, answer with: "+handler.value);
            }
            return handler.value;
        });
        return handler;
    },

    createCommand: function(config, responseHandler){
        checkProperty(config, "path");
        checkProperty(config, "method");
        resources[config.method.toLowerCase()][config.path] = responseHandler;
        return {stop: function(){delete resources[config.method.toLowerCase()][config.path];}}
    },

    stop: function(callback){
        server.close(callback);
    }

}