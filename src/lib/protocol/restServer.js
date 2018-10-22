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

var express = require('express');
var http = require('http');
var settings = require("./../../../settings");

var resources = {
    "get": {},
    "post": {},
    "put": {}
};

var checkProperty = function(object, propertyName){
    if(!object[propertyName] || !(typeof object[propertyName] === 'string' || object[propertyName] instanceof String)){
        throw new Error("protocol config misses property: "+propertyName);
    }
};

var app = express();

app.get('/', function (req, res) {
  res.status(211).send('OK');
});

//allow CORS
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', req.get('Origin') || '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,OPTIONS,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    } else {
        return next();
    }
});

//raw body encoding (text/plain)
app.use(function rawBody(req, res, next) {
    req.setEncoding('utf8');
    req.body = '';
    req.on('data', function(chunk) {
        req.body += chunk;
    });
    req.on('end', function(){
        next();
    });
});

app.use(function (req, res, next) {
    var method = req.method.toLowerCase();
    var path = req.path;
    var payload = req.body;
    console.log("receive http request: "+method+" "+path);
    if(resources[method] && resources[method][path]){
        res.send(resources[method][path](payload));
    }else{
        var err = new Error('Not Found');
        console.log(req.method);
        console.log(req.path);
        err.status = 404;
        next(err);
    }
});

var server = http.createServer(app);
server.listen(settings.restServer.port);
console.log("rest server on port: ", settings.restServer.port);

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
    stop: function(){
        app.close();
        server.close();
    }
};