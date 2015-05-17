(function() {
  angular.module('webLineApp',
    ['ngAnimate', 'angularMoment', 'btford.socket-io',
     'perfect_scrollbar', 'luegg.directives'])

  .run(function(amMoment) {
    amMoment.changeLocale('zh-tw');
  })

  .factory('socket', function (socketFactory) {
    return socketFactory({
      ioSocket: io.connect(Host + '/' + ChannelName)
    })
  })

  .controller('mainCtrl', function ($scope, $http, socket) {
    // State: login -> chat
    $scope.appStatus = 'login';
    $scope.revision  = null;

    $scope.changeAppStatus = function(status) {
      if (status == 'chat') {
        window.onbeforeunload = function() {
          return '離開本頁會斷線喔。'
        };
      }
      $scope.appStatus = status;
    };

    $scope.updateRevision = function(revision) {
      $scope.revision = revision;
    };
  })

  .controller('loginCtrl', ['$scope', 'loginService',

    function ($scope, loginService) {
      // State: prepare -> verify_code -> [success, error]
      $scope.loginStatus = 'prepare';

      $scope.model = {
        id: '',
        password: ''
      };

      $scope.loginBusy  = false;
      $scope.loginError = null;
      $scope.pinCode    = '';


      $scope.login = function() {
        loginService.login($scope.model)
        .then(function(response) {
          $scope.loginStatus = 'success';

          // change AppStatus
          $scope.changeAppStatus('chat');

          // update Revision
          $scope.updateRevision(response.result);
        }, function(response) {
          $scope.loginStatus = 'error';
          $scope.loginError = response.err;
        }, function(response) {
          $scope.loginStatus = 'verify_code';
          $scope.pinCode = response.result.pinCode;
        });
        $scope.loginBusy = true;
      };
    }
  ])

  .controller('chatFrameCtrl', ['$scope', '$q', 'chatService',

    function ($scope, $q, chatService) {
      // State: intialize -> unselect_buddy -> fetch_recent_messages <-> ready_to_chat
      $scope.chatFrameStatus = 'intialize';

      $scope.myProfile    = null;
      $scope.buddyProfile = null;

      $scope.myAvatar     = null;
      $scope.buddyAvatar  = null;

      $scope.messages = [];
      $scope.buddies = [];

      var genAvatar = function(path) {
        return path ? ('http://os.line.naver.jp/' + path + '/preview') : '/img/no-avatar.png';
      }

      $scope.selectBuddy = function(buddy) {
        $scope.buddyProfile = buddy;
        $scope.buddyAvatar = genAvatar($scope.buddyProfile.picturePath);

        $scope.getRecentMessages();
      };

      $scope.getRecentMessages = function() {
        $scope.messages = [];

        $scope.chatFrameStatus = 'fetch_recent_messages';
        chatService.getRecentMessages($scope.buddyProfile.mid)
        .then(function(response) {
          $scope.messages = response.result.reverse();

          $scope.chatFrameStatus = 'ready_to_chat';
        });
      };

      $q.all([chatService.getProfile(), chatService.getContacts()])
      .then(function(responses) {
        $scope.myProfile = responses[0].result;
        $scope.myAvatar  = genAvatar($scope.myProfile.picturePath);;

        $scope.buddies   = responses[1].result.sort(function(a, b) {return a.mid - b.mid});
        $scope.chatFrameStatus = 'unselect_buddy';
      });
    }
  ])

  .controller('chatCtrl', ['$scope', 'chatService',

    function ($scope, chatService) {
      $scope.model = {
        message: ''
      };

      $scope.isMyMessage = function(message) {
        return message.from == $scope.myProfile.mid;
      };

      $scope.sendMessage = function() {
        var new_message;

        if ($scope.model.message.length > 0 && $scope.buddyProfile) {
          chatService.sendMessage({
            id: $scope.buddyProfile.mid,
            message: $scope.model.message
          });

          new_message = {
            contentType: 0,
            createdTime: new Date(),
            from: $scope.myProfile.mid,
            to:   $scope.buddyProfile.mid,
            text: $scope.model.message
          };
          $scope.messages.push(new_message);

          $scope.model.message = '';
        }
      };

      $scope.inputKeypress = function($event) {
        if ($event.keyCode == 13) {
          $scope.sendMessage();
        }
      };

      chatService.polling(function(response) {
        var operations = response.result,
            message;

        for (var i = 0; i < operations.length; i++) {
          if (operations[i].revision > $scope.revision) {
            message = operations[i].message;
            if (message && $scope.buddyProfile
              && ($scope.buddyProfile.mid == message.from
              /* || $scope.buddyProfile.mid == message.to*/)) {

              $scope.messages.push(message);
            }

            $scope.updateRevision(operations[i].revision);
          }
        }
      });
    }
  ]);

})();
