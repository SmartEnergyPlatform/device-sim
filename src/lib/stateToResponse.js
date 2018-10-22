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

module.exports = function(map, newState, oldState, msg){
    var isInvalid = function(value){
        if(!value){
            return false;
        }
        if(!Array.isArray(value) || value.length !== 2){
            return false;
        }
        if(value[0] !== true && value[0] !== false){
            return false;
        }
        if(!(typeof value[1] === 'string' && value[1] instanceof String)){
            return false;
        }
        return true;
    }

    var handleError = function(){
        var result = map["__error"];
        if(typeof result === 'function' || result instanceof Function){
            result = result(msg, oldState, newState);
        }
        if(isInvalid(result)) {
            response = [false, ""];
        }
    };

    var response = map[newState];
    if(!response){
        response = map["__default"];
    }
    if(typeof response === 'function' || response instanceof Function){
        response = response(msg, oldState, newState);
    }
    if(isInvalid(response)) {
        response = handleError();
    }
    return response;
};