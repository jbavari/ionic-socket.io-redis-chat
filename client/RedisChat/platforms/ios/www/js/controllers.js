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

	$scope.draft = '';
	

	if(Auth.currentUser() == null) {
		$state.go('login');
	}

	$scope.userName = Auth.currentUser().name;

	$scope.messages = [];

	socket.on('messages', function(messages) {
		console.log('got messages: ' + messages);
		console.log(messages);
		for(var i = 0, j = messages.length; i < j; i++) {
			var message = messages[i];
			$scope.messages.push(message);
		}
	})

	socket.on('message:received', function (message) {
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

	$scope.sendMessage = function (message) {
		socket.emit('message:send', { message: message, name: Auth.currentUser().name 	});

		socket.emit('dummy', { yes: true });
		$scope.draft = '';

		// // add the message to our model locally
		// $scope.messages.push({
		// 	user: $scope.name,
		// 	text: $scope.message
		// });

		// clear message box
		// $scope.message = '';
	};
})