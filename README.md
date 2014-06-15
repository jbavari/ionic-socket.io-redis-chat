ionic-socket.io-redis-chat
==========================

Quick project demonstrating how to use Socket.io / Redis / and Ionic to have a simple chat applications with expiring messages

## The idea - Codename VaniChat

I wanted to make a chat application similar to SnapChat where messages are wiped clean after a certain time period.

You enter a channel. Once in a channel, you send messages. All other clients connected in the channel will see the message. Any messages you send are automatically removed after a time period (default 2 mins).

In future versions, the channel itself would eventually expire (like a message).


## Requirements

* [Redis](http://redis.io) `brew install redis`
* [Node.js & npm](https://gist.github.com/isaacs/579814)

## Requirements for Mobile

* [Cordova](http://cordova.apache.org) `npm install -g cordova`
* [Ionic](http://ionicframework.com) `npm install -g ionic`
* iOS SDK
* Android SDK

## Getting started

* Clone the repo and ensure [redis is running](http://redis.io/topics/quickstart)
* run `npm install` to get all packages required to run the server.
* run `node server` to run the server
* visit [VaniChat](http://localhost:8080) in your browser

## Running the iOS Application

* Change directories to client/RedisChat
* run `cordova run ios`

## Running the Android Application

* Change directories to client/RedisChat
* run `cordova run android`

## Technology details

DISCLAIMER: I know using Redis as a data store for large scale users is not intended. I wanted to play more with Redis and get some more experience using it.

The messages are stored in Redis as a sorted set in the `messages:channel:channelname` key where `channelname` is the channel they are in. The value stored is a simple JSON encoded object with information about the message (message, user, expires time) with its score set as it's UNIX time of posting.

There is a method in the server.js file - `removeKeys` that will remove messages from channels
if they exceed the expire time stored in the set.

``` js
//Channels are populated before this call
var channelWatchList = ['Lobby', 'Redis', 'Ionic', 'Socket.io'];
function removeKeys() {
  console.log('We are removing old messages');

  for(var channelIndex in channelWatchList) {
    var channel = channelWatchList[channelIndex];
    var timeToRemove = moment().subtract('m', 2).unix(); //Two minutes ago
    var messageChannel = 'messages:' + channel;

    redisClient.zrangebyscore(messageChannel, 0, timeToRemove, function(err, result) {
      if(result && result.length > 0) {
        console.log('Emitting information to client to remove: ', result);
        for (var resultIndex in result) {
          var message = JSON.parse(result[resultIndex]);
          console.log('emitting: ', message);
          //Signal to all of our connected clients to remove the message.
          io.emit('message:remove:channel:' + channel, { message: message, channel: channel });
        }
      }
    });

    redisClient.zremrangebyscore(messageChannel, 0, timeToRemove, function(err, result) {
      console.log('Removed ', result, ' records');
    });
  }
}

var cleanUpMesssagesInterval = setInterval(removeKeys, 6000);

```

## Interesting tidbits
After failing miserably at trying to make keys that expire, I spoke to Michael Gorsuch and he had found an easier way to manage that using sorted sets and expire times as scores.

The idea is, you have a sorted set with a key. Then you add a score with a JSON encoded string. The score itself is the unix timestamp. Then, have a timer that passes over and checks for a unix timestamp with some time in the past (2 minutes) and remove using `zremrangebyscore` with 0 to the timestamp - time past.

## NOTES

* All ports / hostnames are hardcoded. In later versions these will be put into a configuration file.
* Channels need to be expired - and users then removed from channels as well as messages
