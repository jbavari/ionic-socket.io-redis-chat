angular.module('starter.controllers', ['services'])

.controller('LoginCtrl', function($scope, $state, Auth) {
	$scope.user = { name: '', password: '' };

	$scope.login = function login(user) {
		// console.log('Logging in with user: ' + user);
		Auth.login(user.name, user.password).then(function(data) {
			console.log('auth passed.')
			if(data.success) {
				console.log('auth was successful.')

				$state.go('app');
			}
		})
	}
})

.controller('AppCtrl', function($scope, $state, socket, Auth) {
	//Ensure they are authed first.
	if(Auth.currentUser() == null) {
		$state.go('login');
		return;
	}

	$scope.draft = { message: '' };

	$scope.channels = ['RethinkDB', 'Redis', 'Cordova'];

	$scope.activeChannel = null;

	$scope.userName = Auth.currentUser().name;

	$scope.messages = [];

	socket.on('channels', function channels(channels){
		console.log('channels');

		console.log(channels);
	});

	socket.on('message:received', function messageReceived(message) {
		// if(message.name == Auth.currentUser().name){
			// return;
		// }
		$scope.messages.push(message);
	});

	socket.emit('user:joined', {name: Auth.currentUser().name});

	socket.on('user:joined', function(user) {
		console.log('user:joined');
		$scope.messages.push(user);
	});

	$scope.listenChannel = function listenChannel (channel) {
		socket.on('messages:channel:' + channel, function messages(messages) {
			console.log('got messages: ' + messages);
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
			$scope.messages.push(message);
		});

		socket.on('message:remove:channel:' + channel, function(message) {
			console.log('Message to remove: ' + message);
			$scope.message.shift(message);
		});

	}

	$scope.joinChannel = function joinChannel(channel) {
		$scope.activeChannel = channel;
		$scope.messages = [];

		$scope.listenChannel(channel);
		socket.emit('channel:join', { channel: channel, name: Auth.currentUser().name });
	}

	$scope.sendMessage = function sendMessage(draft) {
		socket.emit('message:send', { message: draft.message, name: Auth.currentUser().name, channel: $scope.activeChannel });

		// socket.emit('dummy', { yes: true });
		$scope.draft.message = '';

		// // add the message to our model locally
		// $scope.messages.push({
		// 	user: $scope.name,
		// 	text: $scope.message
		// });

		// clear message box
		// $scope.message = '';
	};

	$scope.joinChannel('Lobby');
})