(function() {
  var webLineApp = angular.module('webLineApp',
    ['ngAnimate', 'angularMoment', 'btford.socket-io',
     'perfect_scrollbar', 'luegg.directives']);

  webLineApp.run(function(amMoment) {
    amMoment.changeLocale('zh-tw');
  });

  webLineApp.factory('socket', function (socketFactory) {
    return socketFactory({
      ioSocket: io.connect(Host + '/' + ChannelName)
    });
  });

  webLineApp.controller('mainCtrl', function ($scope, $http, socket) {
    // login -> chat
    $scope.appStatus = 'login';

    $scope.changeAppStatus = function(status) {
      $scope.appStatus = status;
    };
  });

  webLineApp.controller('loginCtrl', function ($scope, $http, socket) {
    // prepare -> waiting -> success
    $scope.loginStatus = 'prepare';
    $scope.loginError = null;
    $scope.pinCode = '';
    $scope.user = {
      id: '',
      password: ''
    };

    $scope.login = function() {
      socket.emit('login', $scope.user);
    };

    socket.on('login_waiting', function(response) {
      $scope.loginStatus = 'waiting';
      $scope.pinCode = response.result.pinCode;
    });

    socket.on('login_success', function(response) {
      $scope.loginStatus = 'success';

      // to chat
      $scope.changeAppStatus('chat');

      window.onbeforeunload = function() {
        return '離開本頁會斷線喔。'
      };
    });

    socket.on('login_error', function(response) {
      $scope.loginStatus = 'error';
      $scope.loginError = response.err;
    });
  });

  webLineApp.controller('chatFrameCtrl', function ($scope, $http, socket) {
    $scope.myProfile = null;
    $scope.buddyProfile = null;

    $scope.myAvatar = null;
    $scope.buddyAvatar = null;

    $scope.messages = [];

    $scope.isMyMessage = function(message) {
      return message.from == $scope.myProfile.mid;
    };

    $scope.selectBuddy = function(buddy) {
      $scope.buddyProfile = buddy;
      $scope.buddyAvatar = buddy.picturePath ? ('http://os.line.naver.jp/' + buddy.picturePath + '/preview') : '/img/no-avatar.png';

      $scope.getRecentMessages();
    };

    $scope.getRecentMessages = function() {
      $scope.messages = [];
      socket.emit('getRecentMessages', {id: $scope.buddyProfile.mid, size: 20});
    };

    socket.on('getRecentMessages_success', function(response) {
      $scope.messages = response.result.reverse();
    });


    $scope.getProfile = function() {
      socket.emit('getProfile');
    };

    socket.on('getProfile_success', function(response) {
      $scope.myProfile = response.result;
      $scope.myAvatar = $scope.myProfile.picturePath ? ('http://os.line.naver.jp/' + $scope.myProfile.picturePath + '/preview') : '/img/no-avatar.png';
    });

    $scope.getProfile();

  });

  webLineApp.controller('buddyCtrl', function ($scope, $http, socket) {
    $scope.buddies = [];

    $scope.getContacts = function() {
      socket.emit('getContacts');
    };

    socket.on('getContacts_success', function(response) {
      $scope.buddies = response.result.sort(function(a, b) {return a.mid - b.mid});
    });

    $scope.getContacts();
  });

  webLineApp.controller('chatCtrl', function ($scope, $http, socket) {
    $scope.model = {
      message: ''
    };

    $scope.sendMessage = function() {
      if ($scope.model.message.length > 0 && $scope.buddyProfile) {
        socket.emit('sendMessage', {
          id: $scope.buddyProfile.mid,
          message: $scope.model.message
        });
        $scope.model.message = '';
      }
    };

    $scope.inputKeypress = function($event) {
      if ($event.keyCode == 13) {
        $scope.sendMessage();
      }
    };

    socket.on('polling', function(response) {
      var operations = response.result,
          message;

      for (var i = 0; i < operations.length; i++) {
        message = operations[i].message;
        if (message && $scope.buddyProfile && ($scope.buddyProfile.mid == message.from || $scope.buddyProfile.mid == message.to)) {
          $scope.messages.push(message);
        }
      }
    });
  });

})();
