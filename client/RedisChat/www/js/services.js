var baseUrl = 'http://localhost:8080/';

angular.module('services', [])

.factory('socket', function socket($rootScope) {
  var socket = io.connect(baseUrl);
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    }
  };
})

.factory('Auth', function Auth($q, $http) {
  var user = null;

  try {
    user = JSON.parse(window.localStorage.getItem('user'));
  } catch(ex) { /* Silently fail, no user */ }

  var login = function login(name, password) {
    var deferred = $q.defer();

    var url = baseUrl + 'login';
    var postData = { name: name, password: password };

    $http.post(url, postData).success(function(response) {
      if(response.success) {
        user = { name: response.name, id: response.id };
        window.localStorage.setItem('user', JSON.stringify(user));
        return deferred.resolve(response);
      } else {
        return deferred.resolve('No user found');
      }
    }).error(function(error) {
      //Fail our promise.
      deferred.reject(error);
    })

    return deferred.promise;
  }

  var currentUser = function currentUser() {
    return user;
  }

  var logout = function logout() {
    user = null;
    window.localStorage.removeItem('user');
  }

  return {
    login: login,
    logout: logout,
    currentUser: currentUser
  };
})