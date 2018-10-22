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

function getLinearFunction(x1, y1, x2, y2){
    var m = (y1-y2) / (x1-x2);
    var b = y1 - m*x1;
    return function(x){
        return m*x+b;
    }
}

function Graph(id, config) {
    // user defined properties
    this.canvas = document.getElementById(id);

    // constants
    this.axisColor = '#aaa';
    this.font = '8pt Calibri';
    this.tickSize = 20;

    // relationships
    this.context = this.canvas.getContext('2d');

    this.setConfig(id, config);

    // draw x and y axis
    this.drawXAxis();
    this.drawYAxis();
}

Graph.prototype.setConfig = function(config){
    // user defined properties
    this.minX = config.minX;
    this.minY = config.minY;
    this.maxX = config.maxX;
    this.maxY = config.maxY;
    this.unitsPerTick = config.unitsPerTick;

    // relationships
    this.rangeX = this.maxX - this.minX;
    this.rangeY = this.maxY - this.minY;
    this.unitX = this.canvas.width / this.rangeX;
    this.unitY = this.canvas.height / this.rangeY;
    this.centerY = Math.round(Math.abs(this.maxY / this.rangeY) * this.canvas.height);
    this.centerX = Math.round(Math.abs(this.minX / this.rangeX) * this.canvas.width);
    this.iteration = (this.maxX - this.minX) / 1000;
    this.scaleX = this.canvas.width / this.rangeX;
    this.scaleY = this.canvas.height / this.rangeY;
};

Graph.prototype.drawXAxis = function() {
    var context = this.context;
    context.save();
    context.beginPath();
    context.moveTo(0, this.centerY);
    context.lineTo(this.canvas.width, this.centerY);
    context.strokeStyle = this.axisColor;
    context.lineWidth = 2;
    context.stroke();

    // draw tick marks
    var xPosIncrement = this.unitsPerTick * this.unitX;
    var xPos, unit;
    context.font = this.font;
    context.textAlign = 'center';
    context.textBaseline = 'top';

    // draw left tick marks
    xPos = this.centerX - xPosIncrement;
    unit = -1 * this.unitsPerTick;
    while(xPos > 0) {
        context.moveTo(xPos, this.centerY - this.tickSize / 2);
        context.lineTo(xPos, this.centerY + this.tickSize / 2);
        context.stroke();
        context.fillText(unit, xPos, this.centerY + this.tickSize / 2 + 3);
        unit -= this.unitsPerTick;
        xPos = Math.round(xPos - xPosIncrement);
    }

    // draw right tick marks
    xPos = this.centerX + xPosIncrement;
    unit = this.unitsPerTick;
    while(xPos < this.canvas.width) {
        context.moveTo(xPos, this.centerY - this.tickSize / 2);
        context.lineTo(xPos, this.centerY + this.tickSize / 2);
        context.stroke();
        context.fillText(unit, xPos, this.centerY + this.tickSize / 2 + 3);
        unit += this.unitsPerTick;
        xPos = Math.round(xPos + xPosIncrement);
    }
    context.restore();
};

Graph.prototype.drawYAxis = function() {
    var context = this.context;
    context.save();
    context.beginPath();
    context.moveTo(this.centerX, 0);
    context.lineTo(this.centerX, this.canvas.height);
    context.strokeStyle = this.axisColor;
    context.lineWidth = 2;
    context.stroke();

    // draw tick marks
    var yPosIncrement = this.unitsPerTick * this.unitY;
    var yPos, unit;
    context.font = this.font;
    context.textAlign = 'right';
    context.textBaseline = 'middle';

    // draw top tick marks
    yPos = this.centerY - yPosIncrement;
    unit = this.unitsPerTick;
    while(yPos > 0) {
        context.moveTo(this.centerX - this.tickSize / 2, yPos);
        context.lineTo(this.centerX + this.tickSize / 2, yPos);
        context.stroke();
        context.fillText(unit, this.centerX - this.tickSize / 2 - 3, yPos);
        unit += this.unitsPerTick;
        yPos = Math.round(yPos - yPosIncrement);
    }

    // draw bottom tick marks
    yPos = this.centerY + yPosIncrement;
    unit = -1 * this.unitsPerTick;
    while(yPos < this.canvas.height) {
        context.moveTo(this.centerX - this.tickSize / 2, yPos);
        context.lineTo(this.centerX + this.tickSize / 2, yPos);
        context.stroke();
        context.fillText(unit, this.centerX - this.tickSize / 2 - 3, yPos);
        unit -= this.unitsPerTick;
        yPos = Math.round(yPos + yPosIncrement);
    }
    context.restore();
};

Graph.prototype.drawEquation = function(equation, color, thickness) {
    var context = this.context;
    context.save();
    context.save();
    this.transformContext();

    context.beginPath();
    context.moveTo(this.minX, equation(this.minX));

    for(var x = this.minX + this.iteration; x <= this.maxX; x += this.iteration) {
        context.lineTo(x, equation(x));
    }

    context.restore();
    context.lineJoin = 'round';
    context.lineWidth = thickness;
    context.strokeStyle = color;
    context.stroke();
    context.restore();
};

Graph.prototype.transformContext = function() {
    var context = this.context;

    // move context to center of canvas
    this.context.translate(this.centerX, this.centerY);

    /*
     * stretch grid to fit the canvas window, and
     * invert the y scale so that that increments
     * as you move upwards
     */
    context.scale(this.scaleX, -this.scaleY);
};

Graph.prototype.reset = function(){
    var context = this.context;
    var canvas = this.canvas;
    context.clearRect(0, 0, canvas.width, canvas.height);
};

angular.module('devicesimGui').directive( 'elemReady', function( $parse ) {
    return {
        restrict: 'A',
        link: function( $scope, elem, attrs ) {
            elem.ready(function(){
                $scope.$apply(function(){
                    var func = $parse(attrs.elemReady);
                    func($scope);
                })
            })
        }
    }
});

angular.module('devicesimGui').component('graph', {
    templateUrl: "/public/pages/graph.html",
    controller: function($http){
        var that = this;

        that.setValueTemplate = function(graph){
            if(!graph.values){
                graph.values = {};
            }
            //set border values
            graph.values[String(graph.config.minX)] = graph.config.defaultY;
            graph.values[String(graph.config.maxX)] = graph.config.defaultY;
            this.commitToHistory(graph);
        };

        function getSendable(graph){
            return {id: graph.id, values: graph.values, config: graph.config, displayName: graph.displayName};
        }

        function getDefaultGraph(){
            return addModelFunctions({
                id: getid(),
                config: {
                    minX: -10,
                    minY: -10,
                    maxX: 10,
                    maxY: 10,
                    defaultY: 1,
                    unitsPerTick: 1
                }
            });
        }

        function addModelFunctions(graph){
            graph.drawFunction = function(){
                graph.graph.drawEquation(function(x) {
                    var prev;
                    var current;
                    var keys = [];
                    for(var k in graph.values) keys.push(parseFloat(k));
                    keys.sort(function(a, b){return a-b});
                    var result = graph.config.minY;
                    keys.forEach(function(k){
                        prev = current;
                        current = k;
                        prev = prev || current; //if first itteration
                        if(current == x){
                            result = graph.values[String(current)];
                            return
                        }else if( (prev > x && x > current) || (prev < x && x < current) ){
                            result = getLinearFunction(current, graph.values[String(current)], prev, graph.values[String(prev)])(x);
                            //result = (graph.values[String(current)] + graph.values[String(prev)]) / 2;
                            return
                        }
                    });
                    return result;
                }, 'green', 3);
            };

            graph.shadow = {max:0, min:0, modx:0, mody:0};

            var getShadowFunction = function(graph){
                var func = Function("x", "return "+graph.shadow.func+";");
                return function(x) {
                    if( x >= graph.shadow.min &&  x <= graph.shadow.max){
                        return func(x-graph.shadow.modx)+graph.shadow.mody;
                    }
                };
            };

            graph.drawShadow = function(){
                try{
                    graph.graph.drawEquation(getShadowFunction(graph), 'gray', 3);
                }catch(err){}
            };

            graph.useShadow = function () {
                try{
                    var f = getShadowFunction(graph);
                    graph.removeValueBetween(graph.shadow.min, graph.shadow.max);
                    for(var x = graph.shadow.min; x <= graph.shadow.max; x=x+0.1){
                        graph.values[String(x)] = f(x);
                    }
                    that.commitToHistory(graph);
                    graph.redraw();
                }catch(err){}
            };

            graph.scale = function(){
                graph.graph.drawXAxis();
                graph.graph.drawYAxis();
            };

            graph.reset = function(){
                graph.graph.reset();
            };

            graph.redraw = function(){
                graph.reset();
                graph.scale();
                graph.drawFunction();
                graph.drawShadow();
            };

            graph.rescale = function(){
                graph.graph.setConfig(graph.config);
                that.setValueTemplate(graph);
                graph.redraw();
            };

            graph.setValue = function(x_canvas, y_canvas){
                var x = x_canvas / graph.graph.scaleX + graph.graph.minX;
                var y = -(y_canvas / graph.graph.scaleY - graph.graph.maxY);
                graph.removeValueBetween(graph.lastDrawn, x);
                graph.lastDrawn = x;
                graph.values[String(x)] = y;
                graph.redraw();
            };

            graph.removeValueBetween = function(last, current){
                if(last !== null){
                    var keys = [];
                    for(var k in graph.values) keys.push(parseFloat(k));
                    keys.sort(function(a, b){return a-b});
                    keys.forEach(function(k){
                        if( (last > k && k > current) || (last < k && k < current) ){
                            delete graph.values[String(k)];
                        }
                    });
                }
            };

            graph.init = function(){
                if(!graph.graph){
                    graph.graph = new Graph(graph.id, graph.config);
                    graph.rescale();

                    graph.drawing = false;
                    graph.lastDrawn = null;

                    var element = angular.element(document.getElementById(graph.id));

                    element.bind('mousedown', function(event){
                        var x;
                        var y;
                        if(event.offsetX!==undefined){
                            x = event.offsetX;
                            y = event.offsetY;
                        } else { // Firefox compatibility
                            x = event.layerX - event.currentTarget.offsetLeft;
                            y = event.layerY - event.currentTarget.offsetTop;
                        }
                        graph.setValue(x, y);
                        graph.drawing = true;
                    });
                    element.bind('mousemove', function(event){
                        if(graph.drawing){
                            var x;
                            var y;
                            // get current mouse position
                            if(event.offsetX!==undefined){
                                x = event.offsetX;
                                y = event.offsetY;
                            } else {
                                x = event.layerX - event.currentTarget.offsetLeft;
                                y = event.layerY - event.currentTarget.offsetTop;
                            }
                            graph.setValue(x, y);
                        }

                    });
                    element.bind('mouseup', function(event){
                        // stop drawing
                        graph.lastDrawn = null;
                        graph.drawing = false;
                        that.commitToHistory(graph);
                    });

                    element.bind('mouseout', function(event){
                        if(graph.drawing){
                            that.commitToHistory(graph);
                        }
                        // stop drawing
                        graph.lastDrawn = null;
                        graph.drawing = false;
                    });
                }
            };
            return graph;
        }


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
                if(!that.graphs.some(function(element, index, array){
                        return element.id === id;
                    })){
                    result = id;
                }
            }
            return result;
        }

        var getReadHandler = function(scope){
            return function(){
                $http.get("/graphs").then(function(response){
                    scope.graphs = response.data.map(function(graph){
                        return addModelFunctions(graph);
                    });
                });
            }
        };


        var handleError = function (deviceResponse) {
            console.log(deviceResponse);
        };


        var getWhriteHandler = function(scope) {
            return function(){
                var graphs = scope.graphs.map(function(graph){return getSendable(graph);});
                $http.put("/graphs", graphs).then(function(response){
                    if(response.data.status !== "OK"){
                        handleError(response.data);
                    }
                });
            }
        };
        
        
        var getAddHandler = function(scope) {
            return function(){
                scope.graphs.push(getDefaultGraph());
            }
        };


        function getUpdateHandler(scope) {
            return function(graph){
                graph.savingState = "saving...";
                if(graph.id){
                    $http.post("/graphs", getSendable(graph)).then(function(response){
                        if(response.data.status === "OK"){
                            graph.savingState = "saved";
                            graph.selectedIndex = graph.oldSelected;
                        }else{
                            graph.savingState = "error: "+response.data.desc;
                        }
                    }, function(response){
                        graph.savingState = "connection error";
                    });
                }else{
                    graph.savingState = "error: no id";
                }
            }
        }

        function getRemoveHandler(scope) {
            return function(graph){
                var index = scope.graphs.indexOf(graph);
                if(graph.id){
                    $http.delete("/graphs/"+graph.id).then(function(response){});
                    scope.graphs.splice(index, 1);
                }
            }
        }

        function clearHandler(scope){
            return function(){
                scope.graphs = [];
            };
        }

        function exportHandler(scope){
            return function(){
                var graphs = scope.graphs.map(function(graph){return getSendable(graph);});
                var data = JSON.stringify(graphs);
                var url = 'data:text/json;charset=utf8,' + encodeURIComponent(data);

                var dlAnchorElem = document.createElement('a');;
                dlAnchorElem.setAttribute("href", url);
                dlAnchorElem.setAttribute("download", "graphs.json");
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
                            var graphs = JSON.parse($scope.file_input.content);
                            scope.graphs.push.apply(scope.graphs, graphs.map(function(graph){
                                return addModelFunctions(graph);
                            }));
                            $scope.closeThisDialog();
                        }
                    }]
                });
            }
        }

        this.getHistory = function(graph){
            if(!graph.history){
                graph.history = {
                    history : [],
                    index: -1
                }
            }
            return graph.history;
        };
        this.commitToHistory = function(graph){
            var history = that.getHistory(graph);
            history.history.splice(history.index+1, history.history.length, JSON.parse(JSON.stringify(graph.values)));
            history.index = history.history.length-1;
        };
        this.undo = function(graph){
            if(that.undoable(graph)){
                var history = that.getHistory(graph);
                history.index--;
                graph.values = JSON.parse(JSON.stringify(history.history[history.index]));
                graph.redraw();
            }
        };
        this.redo = function(graph){
            if(that.redoable(graph)){
                var history = that.getHistory(graph);
                history.index++;
                graph.values = JSON.parse(JSON.stringify(history.history[history.index]));
                graph.redraw();
            }
        };
        this.redoable = function(graph){
            var history = that.getHistory(graph);
            return history.index+1 < history.history.length;
        };
        this.undoable = function(graph){
            var history = that.getHistory(graph);
            return history.index-1 >= 0;
        };


        this.readFromServer = getReadHandler(this);
        this.writeToServer = getWhriteHandler(this);
        this.addGraph = getAddHandler(this);
        this.removeGraph = getRemoveHandler(this);
        this.updateGraph = getUpdateHandler(this);


        this.readFromServer();

        this.onTabSelected = function(graph){
            graph.oldSelected = graph.selectedIndex;
        };


        this.clear = clearHandler(this);
        this.export = exportHandler(this);
        this.import = importHandler(this);
    }
});
