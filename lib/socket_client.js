//'use strict'; Disable strict mode to delete Object when user disconnect.

var LineClient = require('../lib/line_client');

// SocketClient
var SocketClient = function(channel_name) {
  this._io = this.io;
  this._socketlock = false;

  var sc = this;
  sc._channel = sc._io.of('/' + channel_name);
  sc._channel.on('connection', function(socket) {
    if (sc._socketlock) {
      // Avoid duplicate user
      socket.disconnect();
      return;
    } else {
      sc._socketlock = true;
    }

    var line_client = null;
    socket.on('login', function(user) {
      line_client = new LineClient(user.id, user.password);
      line_client.login({
        waiting: function(err, result) {
          sc._channel.emit('login_waiting', {
            err: err,
            result: result
          });
        },
        success: function(err, result) {
          sc._channel.emit('login_success', {
            err: err,
            result: result
          });

          // Start polling
          sc.polling(line_client);
        },
        error: function(err, result) {
          sc._channel.emit('login_error', {
            err: err,
            result: result
          });
        },
      });
    });

    socket.on('getProfile', function() {
      line_client.getProfile(function(err, result) {
        sc._channel.emit('getProfile_response', {
          err: err,
          result: result
        });
      });
    });

    socket.on('getContacts', function() {
      line_client.getAllContactIds(function(err, ids) {
        line_client.getContacts(ids, function(err, result) {
          sc._channel.emit('getContacts_response', {
            err: err,
            result: result
          });
        });
      });
    });

    socket.on('getRecentMessages', function(option) {
      line_client.getRecentMessages(option.id, option.size, function(err, result) {
        sc._channel.emit('getRecentMessages_response', {
          err: err,
          result: result
        });
      });
    });

    socket.on('sendMessage', function(option) {
      line_client.sendMessage(option.id, option.message, function(err, result) {
        sc._channel.emit('sendMessage_response', {
          err: err,
          result: result
        });
      });
    });

    socket.on('disconnect', function(){
      // Release SockectClient and clean socket.io namespace
      var connections = sc._channel.sockets.length;
      if (connections == 0) {
        delete sc._channel;
        delete sc;
      }
    });
  });
};

SocketClient.prototype.polling = function(line_client) {
  var sc = this,
      interval = 1000;

  setInterval(function() {
    line_client.longPoll(50, function(err, result) {
      console.log('polling');
      if (result) {
        sc._channel.emit('polling', {
          err: err,
          result: result
        });
      }
    });
  }, interval);
};

SocketClient.prototype.io = null

module.exports = SocketClient;
