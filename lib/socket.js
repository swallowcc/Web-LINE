'use strict';
var LineClient = require('../lib/line_client');

var SocketClient = function(channel_name) {
  this._io = socket_management.io;

  var sc = this;
  sc._channel = sc._io.of('/' + channel_name);
  sc._channel.on('connection', function(socket) {

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
        sc._channel.emit('getProfile_success', {
          err: err,
          result: result
        });
      });
    });

    socket.on('getContacts', function() {
      line_client.getAllContactIds(function(err, ids) {
        line_client.getContacts(ids, function(err, result) {
          sc._channel.emit('getContacts_success', {
            err: err,
            result: result
          });
        });
      });
    });

    socket.on('getRecentMessages', function(option) {
      line_client.getRecentMessages(option.id, option.size, function(err, result) {
        sc._channel.emit('getRecentMessages_success', {
          err: err,
          result: result
        });
      });
    });

    socket.on('sendMessage', function(option) {
      line_client.sendMessage(option.id, option.message, function(err, result) {
        sc._channel.emit('sendMessage_success', {
          err: err,
          result: result
        });
      });
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

var SocketManagement = function() {
  this.io = null;
};

var socket_management = new SocketManagement();

module.exports = {
  Client: SocketClient,
  management: socket_management
};
