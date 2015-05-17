(function(){
    angular.module('webLineApp')

      .service('chatService', ['$q', 'socket',

        function chatService($q, socket){

          this.getRecentMessages = function(id) {
            return this._generate_method('getRecentMessages', {id: id, size: 20});
          };

          this.getProfile = function() {
            return this._generate_method('getProfile');
          };

          this.getContacts = function() {
            return this._generate_method('getContacts');
          };

          this.sendMessage = function(message) {
            return this._generate_method('sendMessage', message);
          };

          this.polling = function(_callback) {
            socket.on('polling', _callback);
          };


          this._generate_method = function(method, option) {
            var deferred = $q.defer();

            if (option)
              socket.emit(method, option);
            else
              socket.emit(method);

            socket.on(method + '_response', function(response) {
              socket.removeAllListeners([method + '_response']);

              if (!response.err) {
                deferred.resolve(response);
              } else {
                deferred.reject(response);
              }
            });

            return deferred.promise;
          }
        }
    ]);

})();
