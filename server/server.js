var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var redis = require('redis');
// var config = require('./libs/config');
var moment = require('moment');

var PORT = 8080;
var REDIS_PORT = 6379;
var REDIS_HOST = 'localhost';

server.listen(PORT, function() {
    console.log('RedisChat now listening on port: ' + PORT + '\n');
});

redisClient = redis.createClient(REDIS_PORT, REDIS_HOST)
redisPublishClient = redis.createClient(REDIS_PORT, REDIS_HOST)

var connections = 0;

io.on('connection', function(socket){
  console.log('RedisChat - user connected');

  socket.on('disconnect', function(){
    console.log('RedisChat - user disconnected');
  });

  socket.on('message', function(message){
    console.log('message: ' + message);

    //Relay the message out to all who are listening.
    io.emit('message', {message: message, time: moment(), expires: moment() });
  });

});

