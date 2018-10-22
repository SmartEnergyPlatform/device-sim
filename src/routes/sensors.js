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


router.put("/", function(req, res, next){
    var errors = [];
    sensors.reset();
    req.body.devices.forEach(function(sensor){
        var err = sensors.add(sensor);
        if(err){
            errors.push(err);
        }
    });
    if(errors.length === 0){
        res.send({status: "OK"});
    }else{
        res.status(400).send({status: "ERROR", desc: errors});
    }
});

router.post('/', function(req, res, next) {
    var sensor = req.body.device;
    var err = sensors.update(sensor);
    if(err){
        res.status(400).send({status: "ERROR", desc: err});
    }else{
        res.send({status: "OK"});
    }
});

router.get('/', function(req, res, next) {
    res.send({devices: sensors.getAll()});
});

router.delete('/', function(req, res, next) {
    sensors.reset();
    res.send({status: "OK"});
});

router.post('/:id', function(req, res, next) {
    var id = req.params.id;
    var err = sensors.remove(id);
    if(!err){
        var sensor = req.body.device;
        var err = sensors.add(sensor);
        if(err){
            res.status(400).send({status: "ERROR", desc: err});
        }else{
            res.send({status: "OK"});
        }
    }else{
        res.status(400).send({status: "ERROR", desc: err});
    }
});

router.get('/:id', function(req, res, next) {
    var id = req.params.id;
    res.send({devices: sensors.get(id)});
});

router.delete('/:id', function(req, res, next) {
    var id = req.params.id;
    var err = sensors.remove(id);
    if(!err){
        res.send({status: "OK"});
    }else{
        res.status(400).send({status: "ERROR", desc: err});
    }
});

module.exports = router;