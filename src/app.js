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

var settings = require("./../settings");
var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var monitoringApi = require("./routes/monitoring");
var monitoring = require("./lib/monitoring");
var coap = require("./lib/protocol/coapServer");
var rest = require("./lib/protocol/restServer");

var app = express();

var index = require('./routes/index');
var sensors = require("./routes/sensors");
var actuators = require("./routes/actuators");
var graphs = require("./routes/graphs");

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(cookieParser());

app.use("/monitor", monitoringApi);
app.use("/graphs", graphs);
app.use("/sensors", sensors);
app.use("/actuators", actuators);
app.use("/public", express.static("./src/public"));
app.use('/', index);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.send({
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.send({
        message: err.message,
        error: {}
    });
});



app.set('port', settings.gui.port);
var server = app.listen(settings.gui.port, function(){
    console.log("gui on port: ", settings.gui.port);
});

monitoring.init(server);

process.on('SIGTERM', function () {
    actuators.stop();
    sensors.stop();
    rest.stop();
    coap.stop();
    app.close();
    process.exit(0);
});

module.exports = app;
