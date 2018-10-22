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

var graphs = require("./graphs");

function getLinearFunction(x1, y1, x2, y2){
    var m = (y1-y2) / (x1-x2);
    var n = y1 - m*x1;
    return function(x){
        return m*x+n;
    }
}

function getSortedIdList(graph) {
    if(!graph.keys){
        var keys = [];
        for(var k in graph.values) keys.push(parseFloat(k));
        keys.sort(function(a, b){return a-b});
        graph.keys = keys;
    }
    return graph.keys;
}

module.exports = {
    random: function(min, max, decimalPlaces){
        var longNumber = Math.random() * (max - min) + min;
        var roundModifier = Math.pow(10, decimalPlaces);
        var shortNumber = Math.round(longNumber * roundModifier) / roundModifier;
        return shortNumber;
    },
    graph: function(id){
        var graph = graphs.get(id);
        if(!graph){
            throw new Error("unknown graph id "+id);
        }
        var graphHandler = {
            f: function(x){
                var prev;
                var current;
                var result = graph.config.defaultY;
                getSortedIdList(graph).forEach(function(k){
                    prev = current;
                    current = k;
                    prev = prev || current; //if first itteration
                    if(current == x){
                        result = graph.values[String(current)];
                        return
                    }else if( (prev > x && x > current) || (prev < x && x < current) ){
                        result = getLinearFunction(current, graph.values[String(current)], prev, graph.values[String(prev)])(x);
                        return
                    }
                });
                return result;
            },

            interval: function(min, max){
                return {
                    f: function(x){
                        var range = max - min;
                        var residual = (x - min) % range;
                        var newX = residual + min;
                        return graphHandler.f(newX);
                    }
                }
            },

            secInMin: function(){
                var x = new Date().getSeconds();
                return graphHandler.interval(0, 60).f(x);
            },

            secInHour: function(){
                var date = new Date();
                var x = date.getSeconds() + 60*date.getMinutes();
                return graphHandler.interval(0, 60*60).f(x);
            },

            secInDay: function(){
                var date = new Date();
                var x = date.getSeconds() + 60*date.getMinutes() + 60*60*date.getHours();
                return graphHandler.interval(0, 60*60*24).f(x);
            },

            minInHour: function(){
                var date = new Date();
                var x = (date.getSeconds() + 60*date.getMinutes()) / 60;
                return graphHandler.interval(0, 60).f(x);
            },

            minInDay: function(){
                var date = new Date();
                var x = (date.getSeconds() + 60*date.getMinutes() + 60*60*date.getHours())/60;
                return graphHandler.interval(0, 60*24).f(x);
            },

            hourInDay: function(){
                var date = new Date();
                var x = (date.getSeconds() + 60*date.getMinutes() + 60*60*date.getHours())/(60*60);
                return graphHandler.interval(0, 24).f(x);
            }
        };
        return graphHandler;
    }
};