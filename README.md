ionic-socket.io-redis-chat
==========================

Quick project demonstrating how to use Socket.io / Redis / and Ionic to have a simple chat applications with expiring messages

## The idea

I wanted to make a chat application similar to SnapChat where messages are wiped clean after a certain time period.

You enter a channel. Once in a channel, you send messages. All other clients connected in the channel will see the message. Any messages you send are automatically removed after a time period (default 2 mins).

In future versions, the channel itself would eventually expire (like a message).

The messages are stored in Redis in a sorted set `messages:channel:channelname` where `channelname` is the channel they are in with the message and its expire UNIX time.

There is a method in the server.js file - `removeKeys` that will remove messages from channels
if they exceed the expire time stored in the set.

``` js
//Channels are added as users join
var channelWatchList = [];
function removeKeys() {
  console.log('We are removing old messages');

  for(var channelIndex in channelWatchList) {
    var channel = channelWatchList[channelIndex];
    var messageChannel = 'messages:' + channel;
    var args1 = [ messageChannel, moment().subtract('m', 2).unix(), 0 ];
    redisClient.zremrangebyrank(messageChannel, 0, moment().subtract('m', 2).unix(), function(err, result) {
      console.log('Removed ', result + ' messages.');
    });
  }
}

var cleanUpMesssagesInterval = setInterval(removeKeys, 6000);

```

## Requirements

* [Redis](http://redis.io) `brew install redis`
* Node.js & npm (see [this](https://gist.github.com/isaacs/579814))
* [Cordova](http://cordova.apache.org) and [Ionic](http://ionicframework.com) `npm install -g cordova ionic`
* [Gulp.js](http://gulpjs.com) to run the web client

## Getting started

* Clone the repo and ensure [redis is running](http://redis.io/topics/quickstart)
* run `npm install` to get all packages required to run the server.
* run `node server` to run the server at [localhost](http://localhost:8080)

## Running in the browser

* Change directories to client/RedisChat
* run `npm install` to install packages to run web client
* run `gulp server` to host the [web client](http://localhost:4000)

## Running the iOS Application

* Change directories to client/RedisChat
* run `cordova run ios`

## Running the Android Application

* Change directories to client/RedisChat
* run `cordova run android`

## Interesting tidbits
After failing miserably at trying to make keys that expire and talking to Michael Gorsuch,
I found an easier way to manage

## NOTES

* All ports / hostnames are hardcoded. In later versions these will be put into a configuration file.
* Removing messages is not shown in the client yet - only removed from redis store.
