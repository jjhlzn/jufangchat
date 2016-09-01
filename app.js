var express = require('express');
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var path = require('path');
var serveStatic = require('serve-static');
var logger = require('morgan');
var routes = require('./controller');

app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'node_modules')));
app.use(express.static(path.join(__dirname, 'public')));
app.use(logger('dev'));

routes.set(app, io);

http.listen(3000, function(){
  console.log('listening on *:3000');
});

