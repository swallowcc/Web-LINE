(function(){
    angular.module('webLineApp')

      .service('loginService', ['$q', 'socket',

        function loginService($q, socket){

          this.login = function(user) {
            var deferred = $q.defer();

            socket.emit('login', user);

            socket.on('login_waiting', function(response) {
              socket.removeAllListeners(['login_waiting']);
              
              deferred.notify(response);
            });

            socket.on('login_success', function(response) {
              socket.removeAllListeners(['login_success', 'login_error', 'login_waiting']);

              deferred.resolve(response);
            });

            socket.on('login_error', function(response) {
              socket.removeAllListeners(['login_error', 'login_success', 'login_waiting']);

              deferred.reject(response);
            });

            return deferred.promise;
          };
        }
    ]);

})();
