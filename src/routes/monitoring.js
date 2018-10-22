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
var router = express.Router();

var sensors = require("./../lib/sensors");
var actuators = require("./../lib/actuators");


router.get('/sensor/:id', function(req, res, next) {
    var id = req.params.id;
    var sensor = sensors.get(id);
    if(sensor){
        sensor.monitoring = true;
        res.send({status: "OK"});
    }else{
        res.send({status: "ERROR", desc: "sensor id does not exist"});
    }
});

router.delete('/sensor/:id', function(req, res, next) {
    var id = req.params.id;
    var sensor = sensors.get(id);
    if(sensor){
        sensor.monitoring = false;
        res.send({status: "OK"});
    }else{
        res.send({status: "ERROR", desc: "sensor id does not exist"});
    }
});

router.get('/actuator/:id', function(req, res, next) {
    var id = req.params.id;
    var actuator = actuators.get(id);
    if(actuator){
        actuator.monitoring = true;
        res.send({status: "OK"});
    }else{
        res.send({status: "ERROR", desc: "actuator id does not exist"});
    }
});

router.delete('/actuator/:id', function(req, res, next) {
    var id = req.params.id;
    var actuator = actuators.get(id);
    if(actuator){
        actuator.monitoring = false;
        res.send({status: "OK"});
    }else{
        res.send({status: "ERROR", desc: "actuator id does not exist"});
    }
});

module.exports = router;