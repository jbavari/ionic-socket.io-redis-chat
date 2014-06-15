angular.module('starter.controllers', ['services'])

.controller('LoginCtrl', function($scope, $state, Auth) {

	//input model
	$scope.user = { name: '', password: '' };

	$scope.login = function login(user) {
		Auth.login(user.name, user.password).then(function(data) {
			console.log('auth passed.')
			if(data.success) {
				console.log('auth was successful.')

				$state.go('app');
			} else {
				alert('Username / Password not valid. Try again');
			}
		})
	}
})

.controller('AppCtrl', function($scope, $state, $filter, socket, Auth) {
	//Ensure they are authed first.
	if(Auth.currentUser() == null) {
		$state.go('login');
		return;
	}

	//input models
	$scope.draft = { message: '' };
	$scope.channel = { name: '' };

	//App info
	$scope.channels = [];
	$scope.listeningChannels = [];
	$scope.activeChannel = null;
	$scope.userName = Auth.currentUser().name;
	$scope.messages = [];

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
//Socket.io listeners
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

	socket.on('channels', function channels(channels){
		console.log('channels', channels);

		console.log(channels);
		$scope.channels = channels;
		$scope.channels = channels;
	});

	socket.on('message:received', function messageReceived(message) {
		$scope.messages.push(message);
	});

	socket.emit('user:joined', {name: Auth.currentUser().name});

	socket.on('user:joined', function(user) {
		console.log('user:joined');
		$scope.messages.push(user);
	});

	$scope.listenChannel = function listenChannel (channel) {
		socket.on('messages:channel:' + channel, function messages(messages) {
			console.log('got messages: ', messages);
			console.log(messages.length);
			for(var i = 0, j = messages.length; i < j; i++) {
				var message = messages[i];
				console.log('message');
				console.log(message);
					console.log('apply with function');
				$scope.messages.push(message);
			}
		});

		socket.on('message:channel:' + channel, function message(message) {
			console.log('got message: ' + message);
			if(channel != $scope.activeChannel) {
				return;
			}
			$scope.messages.push(message);
		});

		socket.on('message:remove:channel:' + channel, function(removalInfo) {
			console.log('removalInfo to remove: ', removalInfo);
			var expires = removalInfo.message.expires;
			var expireMessageIndex = $filter('messageByExpires')($scope.messages, expires);
			if(expireMessageIndex) {
				$scope.messages.splice(expireMessageIndex, 1);
			}

		});

		$scope.listeningChannels.push(channel);

	}

///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////
// Controller methods
///////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////

	$scope.joinChannel = function joinChannel(channel) {
		$scope.activeChannel = channel;
		$scope.messages = [];

		$scope.channel.name = '';

		//Listen to channel if we dont have it already.
		if($scope.listeningChannels.indexOf(channel) == -1) {
			$scope.listenChannel(channel);		
		}

		socket.emit('channel:join', { channel: channel, name: Auth.currentUser().name });
	}

	$scope.sendMessage = function sendMessage(draft) {
		if(!draft.message || draft.message == null || typeof draft == 'undefined' || draft.length == 0) {
			return;
		}
		socket.emit('message:send', { message: draft.message, name: Auth.currentUser().name, channel: $scope.activeChannel });
		$scope.draft.message = '';
	};

	$scope.logout = function logout() {
		Auth.logout();
		$state.go('login');
	}

	//Auto join the lobby
	$scope.joinChannel('Lobby');
})