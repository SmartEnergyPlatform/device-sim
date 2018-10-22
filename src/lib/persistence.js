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

var when = require('when');
var MongoClient = require('mongodb').MongoClient;
var settings = require("./../../settings");

var mongodb;

function db() {
    return when.promise(function(resolve,reject,notify) {
        if (!mongodb) {
            MongoClient.connect(settings.mongourl,
                {
                    db:{
                        retryMiliSeconds:1000,
                        numberOfRetries:3
                    },
                    server:{
                        poolSize:1,
                        auto_reconnect:true,
                        socketOptions:{
                            socketTimeoutMS:10000,
                            keepAlive:1
                        }
                    }
                },
                function(err,_db) {
                    if (err) {
                        console.error("Mongo DB error:"+err);
                        reject(err);
                    } else {
                        mongodb = _db;
                        resolve(_db);
                    }
                }
            );
        } else {
            resolve(mongodb);
        }
    });
}

function getCollectionGetter(name){
    return function() {
        return when.promise(function(resolve,reject,notify) {
            db().then(function(db) {
                db.collection(name,function(err,_collection) {
                    if (err) {
                        console.log("Mongo DB error:"+err);
                        reject(err);
                    } else {
                        resolve(_collection);
                    }
                });
            }).otherwise(function (err) {
                reject(err);
            })
        });
    }
}

module.exports = {
    as: function(collection){
        var collection = getCollectionGetter(collection);
        return {
            get: function(callback){
                collection().then(function(collection) {
                    collection.find({}).toArray(function(err, docs) {
                        callback(docs);
                    });
                }).otherwise(function(err) {
                    defer.reject(err);
                });
            },
            add: function(entity){
                collection().then(function(collection){
                    collection.insertMany([entity]);
                });
            },
            remove: function(id){
                collection().then(function(collection){
                    collection.deleteOne({ id : id }, function(err, result) {});
                });
            },
            reset: function(){
                collection().then(function(collection) {
                    collection.find({}).toArray(function(err, docs) {
                        docs.forEach(function(doc){
                            collection.deleteOne(doc, function(err, result) {});
                        });
                    });
                });
            }
        }
    }
}