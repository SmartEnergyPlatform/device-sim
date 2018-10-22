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

var persistence = require("./persistence").as("graphs");

var graphs = {};

var add = function(graphMsg){
    if(!graphs[graphMsg.id]){
        graphs[graphMsg.id] = graphMsg;
    }else{
        return "graph with id "+graphMsg.id+" exists already";    // error message
    }
};

var dotEncode = "%2E";
function encodeDots(graph) {
    var result = {};
    for (var key in graph.values) {
        if (graph.values.hasOwnProperty(key)) {
            var newKey = key.replace(/\./g, dotEncode);
            result[newKey] = graph.values[key];
        }
    }
    var clone = JSON.parse(JSON.stringify(graph));
    clone.values = result;
    return clone;
}

function decodeDots(graph) {
    var result = {};
    for (var key in graph.values) {
        if (graph.values.hasOwnProperty(key)) {
            var newKey = key.replace(dotEncode, ".");
            result[newKey] = graph.values[key];
        }
    }
    var clone = JSON.parse(JSON.stringify(graph));
    clone.values = result;
    return clone;
}

var addWithPersistence = function(graph){
    var err = add(graph);
    if(!err){
        persistence.add(encodeDots(graph));
    }
    return err;
};

var remove = function(id){
    //TODO: check if is used
    if(graphs[id]){
        delete graphs[id];
        persistence.remove(id);
    }else{
        return "error sonsor with id "+id+" does not exist"; // error message
    }
};

persistence.get(function(graphs){
    console.log("init graphs");
    graphs.forEach(function(graph){
        try{
            add(decodeDots(graph));
        }catch(e){
            console.error(e);
        }
    });
});

module.exports = {
    get: function(id){return graphs[id];},
    getAll: function(){return Object.keys(graphs).map(function(key){return graphs[key];})},
    getAllShort: function(){return Object.keys(graphs).map(function(key){var graph = graphs[key]; return {id: graph.id, displayName: graph.displayName}})},
    add: addWithPersistence,
    update: function(graph){
        var err;
        if(graphs[graph.id]){
            err = remove(graph.id)
        }
        if(!err){
            err = addWithPersistence(graph);
        }
        return err;
    },
    remove: remove,
    reset: function (){
        graphs = {};
        persistence.reset();
    }
};