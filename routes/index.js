var express = require('express');
var router = express.Router();
var md5 = require('MD5');
var SocketClient = require('../lib/socket').Client;

/* GET home page. */

router.get('/', function(req, res) {
  var time_seed    = new Date(),
      channel_name = md5(time_seed);

  // Create socket client for LineClient
  var socket_client = new SocketClient(channel_name);

  res.render('index', { channel_name: channel_name });
});

module.exports = router;
