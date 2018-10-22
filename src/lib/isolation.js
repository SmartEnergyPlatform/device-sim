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

const VM = require('vm2').NodeVM;
const sandbox = require('./sensorContentSandbox')

var vms = {};

module.exports = {
    init: function(id){vms[id] = new VM({
        sandbox:sandbox
    });},
    makeFunction: function(id ,functionString){
        return vms[id].run(functionString);
    },
    reset: function(id){delete vms[id]; module.exports.init(id);}
};