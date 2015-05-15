var express = require('express');
var router = express.Router();
var md5 = require('MD5');
var SocketClient = require('../lib/socket').Client;

/* GET home page. */

router.get('/', function(req, res) {
  var time_seed    = new Date(),
      channel_name = md5(time_seed),
      port         = req.app.settings.port,
      host         = req.protocol + '://' + req.host  + ( port != 3000 ? '' : ':' + port );

  // Create socket client for LineClient
  var socket_client = new SocketClient(channel_name);

  res.render('index', {
    host: host,
    channel_name: channel_name
  });
});

module.exports = router;
