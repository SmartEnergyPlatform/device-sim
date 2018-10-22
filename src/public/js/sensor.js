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

angular.module('devicesimGui').component('sensor', {
    templateUrl: "/public/pages/sensor.html",
    controller: function($http, $scope, $rootScope, ngDialog){
        var that = this;

        var addDeviceModelFunctions = function(device){
            device.contentAceLoad = function(editor){
                device.editor_content = editor;
                editor.getSession().getDocument().setValue(device.data.contentCreator);

                editor.completers.push({
                    getCompletions: function (editor, session, pos, prefix, callback) {
                        callback(null, [
                            {
                                caption: "random(min, max, decimalPlaces)",
                                value: "random(min, max, decimalPlaces)",
                                meta: "static"
                            }
                        ]);
                    }
                });

                editor.completers.push({
                    getCompletions: function (editor, session, pos, prefix, callback) {
                        $http.get("/graphs/short").then(function(response){
                            callback(null, response.data.map(function(graph){
                                var name = graph.displayName || "";
                                var nameComment = name != "" ? "/*"+name+"*/" : "";
                                return {
                                    caption: "graph "+name+" "+graph.id,
                                    value: "graph("+nameComment+"\""+graph.id+"\")",
                                    meta: "static"
                                }
                            }));
                        });
                    }
                });

                editor.completers.push({
                    getCompletions: function (editor, session, pos, prefix, callback) {
                        console.log(prefix, pos);
                        callback(null, [
                            {
                                caption: "f",
                                value: "f(x)",
                                meta: "static"
                            },
                            {
                                caption: "interval",
                                value: "interval(min, max)",
                                meta: "static"
                            },
                            {
                                caption: "secInMin",
                                value: "secInMin()",
                                meta: "static"
                            },
                            {
                                caption: "secInHour",
                                value: "secInHour()",
                                meta: "static"
                            },
                            {
                                caption: "secInDay",
                                value: "secInDay()",
                                meta: "static"
                            },
                            {
                                caption: "minInHour",
                                value: "minInHour()",
                                meta: "static"
                            },
                            {
                                caption: "minInDay",
                                value: "minInDay()",
                                meta: "static"
                            },
                            {
                                caption: "hourInDay",
                                value: "hourInDay()",
                                meta: "static"
                            }
                        ]);
                    }
                });
            };
            device.contentAceChange = function(){
                var value = device.editor_content.getSession().getDocument().getValue();
                device.data.contentCreator = value;
            };
            device.logs = [];
            device.addMonitoringMsg = function(msg){
                device.logs.push(msg);
                if(msg.topic === "msg_send"){
                    device.currentValue = msg.msg;
                }
                $scope.$apply();
            };

            device.formatAceLoad = function(editor) {
                device.editor_format = editor;
                editor.getSession().getDocument().setValue(device.data.requestFormat);

                editor.completers = [{
                    getCompletions: function (editor, session, pos, prefix, callback) {
                        callback(null, [
                            {
                                caption: "TIME_STAMP (e.g. 1478014571168)",
                                value: "{{{TIME_STAMP}}}",
                                meta: "static"
                            },
                            {
                                caption: "TIME_UTC (e.g. Tue, 01 Nov 2016 15:43:09 GMT)",
                                value: "{{{TIME_UTC}}}",
                                meta: "static"
                            },
                            {
                                caption: "TIME_ISO (e.g. 2016-11-01T15:39:15.378Z)",
                                value: "{{{TIME_ISO}}}",
                                meta: "static"
                            },
                            {
                                caption: "TIME_STRING (e.g. Tue Nov 01 2016 16:35:56 GMT+0100 (CET))",
                                value: "{{{TIME_STRING}}}",
                                meta: "static"
                            },
                            {
                                caption: "TIME_DATE (e.g. Tue Nov 01 2016)",
                                value: "{{{TIME_DATE}}}",
                                meta: "static"
                            },
                            {
                                caption: "TIME_TIME (e.g. 16:41:43 GMT+0100 (CET))",
                                value: "{{{TIME_TIME}}}",
                                meta: "static"
                            }
                        ]);
                    }
                }];
            };

            device.formatAceChange = function(){
                var value = device.editor_format.getSession().getDocument().getValue();
                device.data.requestFormat = value;
            };

            return device;
        };


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
                $http.get("/sensors").then(function(response){
                    scope.devices = response.data.devices.map(function(device){
                        return addDeviceModelFunctions(normalizeProtocolConf(device));
                    });
                });
            }
        };


        var handleError = function (deviceResponse) {
            console.log(deviceResponse);
        };


        var getWhriteHandler = function(scope) {
            return function(){
                var devices = scope.devices.map(function(device){return device.data;});
                $http.put("/sensors", {devices: devices}).then(function(response){
                    if(response.data.status !== "OK"){
                        handleError(response.data);
                    }
                });
            }
        };


        var newProtocolConfig = {
            "REST-SERVER" : function(id){
                return {
                    method: "get",
                    path: "/sensor/"+id
                };
            },
            "COAP-SERVER" : function(id){
                return {
                    method: "get",
                    path: "/sensor/"+id
                };
            },
            "HTTP-CLIENT" : function(id){
                return {
                    method: "post",
                    url: "http://localhost:8081/sensor/"+id,
                    headers: {
                        'Content-Type': "text/plain"
                    }
                };
            },
            "REST-CLIENT" : function(id){
                return {
                    method: "post",
                    url: "http://localhost:8081/sensor/"+id,
                    headers: {
                        'Content-Type' : "application/json"
                    }
                };
            },
            "COAP-CLIENT" : function(id){
                return {
                    method: "post",
                    url: "coap://localhost:8081/sensor/"+id
                };
            },
            "MQTT-PRODUCER" : function(id){
                return {
                    topic: id,
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

        var getDefaultDevice = function(){
            var device =  {
                data : {
                    id: getid(),
                    displayName: "",
                    interval: {
                        value: 2,
                        unit: "seconds"
                    },
                    requestFormat: "{ \"value\": \"{{value}}\" }",
                    contentCreator: "module.exports = function(id, count){\n\treturn {value: random(1.5/*min*/, 1.6/*max*/, 3/*decimalPlaces*/)};\n}",
                    protocolConf: {
                        type: "HTTP-CLIENT",
                        conf:{}
                    }
                }
            }

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
                    $http.post("/sensors", {device: device.data}).then(function(response){
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
                    $http.delete("/sensors/"+device.data.id).then(function(response){});
                    scope.devices.splice(index, 1);
                }
            }
        }
        
        function activateMonitoring(device){
            $http.get("/monitor/sensor/"+device.data.id).then(function(response){});
        }

        function deactivateMonitoring(device){
            $http.delete("/monitor/sensor/"+device.data.id).then(function(response){});
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
                dlAnchorElem.setAttribute("download", "sensors.json");
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
        
        this.readFromServer();

        $rootScope.setSensorMonitoringMessage = function(message){
            that.devices.forEach(function(sensor){
                if(message.sensorID === sensor.data.id){
                    sensor.addMonitoringMsg(message);
                }
            });
        };

        this.onTabSelected = function(device){
            device.oldSelected = device.selectedIndex;
        };
        this.activateMonitoring = activateMonitoring;
        this.deactivateMonitoring = deactivateMonitoring;

        this.clear = clearHandler(this);
        this.export = exportHandler(this);
        this.import = importHandler(this);
    }
});
