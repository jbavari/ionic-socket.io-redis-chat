var Q = require('q');
var express = require('express');
var app = express();
var bodyParser = require('body-parser')
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var redis = require('redis');
// var config = require('./libs/config');
var moment = require('moment');

var connections = 0;

var PORT = 8080;
var REDIS_PORT = 6379;
var REDIS_HOST = 'localhost';

var redisClient = redis.createClient(REDIS_PORT, REDIS_HOST)
var redisPublishClient = redis.createClient(REDIS_PORT, REDIS_HOST)


// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded())

// parse application/json
app.use(bodyParser.json())

// parse application/vnd.api+json as json
app.use(bodyParser.json({ type: 'application/vnd.api+json' }))

// app.use(function (req, res, next) {
//   console.log(req.body) // populated!
//   next()
// })

server.listen(PORT, function() {
    console.log('RedisChat now listening on port: ' + PORT + '\n');
});

var allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      
    // intercept OPTIONS method
    if ('OPTIONS' == req.method) {
      res.send(200);
    }
    else {
      next();
    }
};
app.use(allowCrossDomain);

app.post('/login', function(req, resp) {
  // console.log(req);
  // console.log(req.param('name'));
  var name = req.param('name');
  var password = req.param('password');
  if(!name || !password) {
    resp.send('No username or password given. Please give correct credientials');
    return;
  }

  console.log('Password attempt by: ' + name + ' at: ' + moment() );
  if(password && password == 'letmein') {
    //Add redis key for users
    var userKey = 'user:' + name;
    redisClient.set(userKey, moment(), redis.print);
  }
  connections += 1;
  resp.send({success: true, name: name, id: connections});
})

function getMessages(channel) {
  var deferred = Q.defer();

  var messageChannel = 'messages:' + channel;
  var args1 = [ messageChannel, 1000, 0 ];
  redisClient.zrevrangebyscore(args1, function (err, response) {
      // if (err) throw err;
      // console.log('what', response);
      var messageList = [];
      for(var i = 0, j = response.length; i < j; i++) {
        messageList.push(JSON.parse(response[i]));
      }
      deferred.resolve(messageList);
  });

  return deferred.promise;
}

function getChannels() {
  var deferred = Q.defer();

  // redisClient.

  return deferred.promise;
}

var channelWatchList = [];

function removeKeys() {
  console.log('We are removing old messages');

  for(var channelIndex in channelWatchList) {
    var channel = channelWatchList[channelIndex];
    var messageChannel = 'messages:' + channel;
    console.log('message channel', messageChannel)
    var args1 = [ messageChannel, moment().subtract('m', 2).unix(), 0 ];
    console.log(args1);
    redisClient.zremrangebyrank(messageChannel, 0, moment().subtract('m', 2).unix(), function(err, result) {
      console.log('Removing: ', result);
    });
  }
}

var cleanUpMesssagesInterval = setInterval(removeKeys, 6000);

io.on('connection', function(socket){
  var counter = 0;
  console.log('RedisChat - user connected');

  getChannels().then(function(data) {

  });

  socket.on('disconnect', function(){
    console.log('RedisChat - user disconnected');
  });

  socket.on('user:joined', function(user) {
    var message = user.name + ' joined the room';
    io.emit('user:joined', {message: message, time: moment(), expires: moment().add(10) })
  })

  socket.on('message:send', function(message){
    console.log('message: ' + message);
    console.log(JSON.stringify(message));
    // var messageKey = 'message:' + message.name;
    // console.log('Storing key: ' + messageKey);
    var messageObj = { message: message.message, name: message.name, time: moment(), expires: moment().add('m', 2).unix() };
    // console.log('this: ' + JSON.stringify(messageObj));
    // redisClient.set(messageKey, JSON.stringify(messageObj), redis.print);
    // redisClient.expire(messageKey, 600);

    console.log('storing to set: messages:' + message.channel);

    redisClient.zadd('messages:' +  message.channel, moment().add('m', 2).unix(), JSON.stringify(messageObj));

    //Relay the message out to all who are listening.
    io.emit('message:channel:' + message.channel, messageObj);
    console.log('emited: ' + messageObj);
  });

  socket.on('channel:join', function(channelInfo) {
    console.log('Channel joined');
    console.log(channelInfo);
    redisClient.zadd('users:' + channelInfo.channel, 100, channelInfo.name, redis.print);

    //Add to watch to remove list.
    channelWatchList.push(channelInfo.channel);
      //Emit back any messages that havent expired yet.
    getMessages(channelInfo.channel).then(function(data){
      // console.log('got messages');
      // console.log(data);
      socket.emit('messages:channel:' + channelInfo.channel, data);
    });
  });

});