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

angular.module('devicesimGui').component('actuator', {
    templateUrl: "/public/pages/actuator.html",
    controller: function($http, $rootScope, $scope, ngDialog){
        var that = this;

        function guid() {
            function _p8(s) {
                var p = (Math.random().toString(16)+"000000000").substr(2,8);
                return s ? "-" + p.substr(0,4) + "-" + p.substr(4,4) : p ;
            }
            return _p8() + _p8(true) + _p8(true) + _p8();
        }

        function getid(){
            var result;
            while(!result){
                var id = guid();
                if(!that.devices.some(function(element, index, array){
                        return element.data.id === id;
                    })){
                    result = id;
                }
            }
            return result;
        }

        var getDefaultState = function(){
            return {
                regex: ".*",
                response: "foo",
                adopt: true
            };
        };

        var addDeviceModelFunctions = function(device){
            device.parserAceLoad = function(editor){
                device.parserEditor = editor;
                editor.getSession().getDocument().setValue(device.data.parser);
            };
            device.parserAceChange = function(){
                var value = device.parserEditor.getSession().getDocument().getValue();
                device.data.parser = value;
            };
            device.removeState = function(state){
                var index = device.data.states.indexOf(state);
                device.data.states.splice(index, 1);
            };
            device.addState = function(){
                device.data.states.push(getDefaultState());
            };
            device.stateUp = function(state){
                var index = device.data.states.indexOf(state);
                if(index > 0){
                    var temp = device.data.states[index-1];
                    device.data.states[index-1] = device.data.states[index];
                    device.data.states[index] = temp;
                }
            };
            device.stateDown = function(state){
                var index = device.data.states.indexOf(state);
                if(index+1 < device.data.states.length){
                    var temp = device.data.states[index+1];
                    device.data.states[index+1] = device.data.states[index];
                    device.data.states[index] = temp;
                }
            };
            device.logs = [];
            device.addMonitoringMsg = function(msg){
                device.logs.push(msg);
                if(msg.topic === "command" && msg.msg.state.adopt){
                    device.currentState = msg.msg.parsed;
                }
                $scope.$apply();
            };
            return device;
        };

        var normalizeProtocolConf = function(device){
            if (typeof device.protocolConf === 'string' || device.protocolConf instanceof String){
                device.protocolConf = JSON.parse(device.protocolConf);
            }
            if(device.protocolConf.conf.method){
                device.protocolConf.conf.method = device.protocolConf.conf.method.toLowerCase();
            }
            return {data: device};
        };

        var getReadHandler = function(scope){
            return function(){
                $http.get("/actuators").then(function(response){
                    scope.devices = response.data.devices.map(function(device){
                        return addDeviceModelFunctions(normalizeProtocolConf(device));
                    });
                });
            }
        };


        var newProtocolConfig = {
            "REST-SERVER" : function(id){
                return {
                    method: "post",
                    path: "/actuator/"+id
                };
            },
            "COAP-SERVER" : function(id){
                return {
                    method: "post",
                    path: "/actuator/"+id
                };
            },
            "MQTT-CONSUMER" : function(id){
                return {
                    topic: id,
                    url: "mqtt://localhost:8081",
                    qos: 0,
                    user: "",
                    pw: ""
                };
            },
            "MQTT-RESPONSIVE-CONSUMER" : function(id){
                return {
                    topic: id,
                    response_topic: "response_"+id,
                    url: "mqtt://localhost:8081",
                    qos: 0,
                    user: "",
                    pw: ""
                };
            }
        };

        var changeProtocolType = function(device){
            var id = device.data.id;
            var type = device.data.protocolConf.type;
            device.data.protocolConf.conf = newProtocolConfig[type](id);
            return device;
        };

        var handleError = function (deviceResponse) {
            console.log(deviceResponse);
        };


        var getWhriteHandler = function(scope) {
            return function(){
                var devices = scope.devices.map(function(device){return device.data;});
                $http.put("/actuators", {devices: devices}).then(function(response){
                    if(response.data.status !== "OK"){
                        handleError(response.data);
                    }
                });
            }
        };


        var getDefaultDevice = function(){
            var parser = "module.exports = function(msg){return msg;}";

            var device = {
                data:{
                    id: getid(),
                    states: [],
                    parser: parser,
                    protocolConf : {
                        type: "REST-SERVER",
                        conf:{}
                    }
                }
            };
            changeProtocolType(device); //create default protocol properties
            addDeviceModelFunctions(device);
            return device;
        };

        var getAddDeviceHandler = function(scope) {
            return function(){
                scope.devices.push(getDefaultDevice())
            }
        };


        function getUpdateHandler(scope) {
            return function(device){
                device.savingState = "saving...";
                if(device.data.id){
                    $http.post("/actuators", {device: device.data}).then(function(response){
                        if(response.data.status === "OK"){
                            device.savingState = "saved";
                            device.selectedIndex = device.oldSelected;
                        }else{
                            device.savingState = "error: "+response.data.desc;
                        }
                    }, function(response){
                        device.savingState = "connection error";
                    });
                }else{
                    device.savingState = "error: no id";
                }
            }
        }

        function getRemoveHandler(scope) {
            return function(device){
                var index = scope.devices.indexOf(device);
                if(device.data.id){
                    $http.delete("/actuators/"+device.data.id).then(function(response){});
                    scope.devices.splice(index, 1);
                }
            }
        }

        function activateMonitoring(device){
            $http.get("/monitor/actuator/"+device.data.id).then(function(response){});
        }

        function deactivateMonitoring(device){
            $http.delete("/monitor/actuator/"+device.data.id).then(function(response){});
        }

        function clearHandler(scope){
            return function(){
                scope.devices = [];
            };
        }

        function exportHandler(scope){
            return function(){
                var devices = scope.devices.map(function(device){return device.data;});
                var data = JSON.stringify(devices);
                var url = 'data:text/json;charset=utf8,' + encodeURIComponent(data);

                var dlAnchorElem = document.createElement('a');;
                dlAnchorElem.setAttribute("href", url);
                dlAnchorElem.setAttribute("download", "actuators.json");
                dlAnchorElem.click();
            }
        }

        function importHandler(scope){
            return function(){
                ngDialog.open({
                    template: '<ng-file-input mode="text" ng-model="file_input"></ng-file-input><button type="button" class="btn btn-default" ng-click="import()">Import</button>',
                    plain: true,
                    className: 'ngdialog-theme-plain',
                    controller: ["$scope", function($scope) {
                        $scope.import = function(){
                            var devices = JSON.parse($scope.file_input.content);
                            scope.devices.push.apply(scope.devices, devices.map(function(device){
                                return addDeviceModelFunctions(normalizeProtocolConf(device));
                            }));
                            $scope.closeThisDialog();
                        }
                    }]
                });
            }
        }

        this.readFromServer = getReadHandler(this);
        this.writeToServer = getWhriteHandler(this);
        this.addDevice = getAddDeviceHandler(this);
        this.removeDevice = getRemoveHandler(this);
        this.updateDevice = getUpdateHandler(this);

        this.changeProtocolType = changeProtocolType;

        this.onTabSelected = function(device){
            device.oldSelected = device.selectedIndex;
        };

        this.readFromServer();

        this.activateMonitoring = activateMonitoring;
        this.deactivateMonitoring = deactivateMonitoring;

        this.clear = clearHandler(this);
        this.export = exportHandler(this);
        this.import = importHandler(this);

        $rootScope.setActuatorMonitoringMessage = function(message){
            that.devices.forEach(function(actuator){
                if(message.actuatorID === actuator.data.id){
                    actuator.addMonitoringMsg(message);
                }
            });
        }
    }
});
