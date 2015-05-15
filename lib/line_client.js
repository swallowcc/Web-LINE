'use strict';

var thrift       = require('thrift'),
    line_types   = require('./gen-nodejs/line_types'),
    talk_service = require('./gen-nodejs/TalkService');

var request = require('request');

var Message = line_types.Message,
    ContentType = line_types.ContentType,
    OperationType = line_types.OperationType;

// Constant
var LINE_DOMAIN             = 'gd2.line.naver.jp',
    LINE_PATH               = '/api/v4/TalkService.do',
    LINE_IN_PATH            = '/P4',
    LINE_CERTIFICATE_PATH   = '/Q',
    LINE_SESSION_LINE_PATH  = '/authct/v1/keys/line',
    LINE_SESSION_NAVER_PATH = '/authct/v1/keys/naver';

// Line Config
var ip       = '127.0.0.1',
    version  = '3.7.0',
    com_name = 'webline',
    revision = 0;

// LineClient
var LineClient = function(email, password) {
  this._userInfo = {
    email:    email,
    password: password
  };
  this._header = {
    'Content-Type': 'application/x-thrift',
    'X-Line-Application': 'DESKTOPMAC\t3.7.0\tMAC\t10.9.4-MAVERICKS-x64'
  };
  this._thrift_options = null;
  this._revision       = null;

  this._connection     = null;
  this._client         = null;
};

LineClient.prototype.initConnection = function() {
  // Line Thrift Config
  this._thrift_options = {
     transport: thrift.TBufferedTransport,
     protocol: thrift.TCompactProtocol,
     path: LINE_PATH,
     headers: this._header,
     https: false
  };

  this._connection = thrift.createHttpConnection(LINE_DOMAIN, 80, this._thrift_options);
  this._client = thrift.createHttpClient(TalkServiceClient, this._connection);

  this._connection.on('error', function(err) {
    console.log(err);
  });
};

LineClient.prototype.login = function(_callback_options) {
  var lc = this;
  lc.initConnection();
  lc._client.loginWithIdentityCredentialForCertificate(1,
      lc._userInfo.email, lc._userInfo.password,
      true, ip, com_name, '', function(err, result) {

    var request_options, verifier_code;
    if (!err && _callback_options.success) {
      if (_callback_options.waiting) {
        _callback_options.waiting(err, result);
      }

      verifier_code   = result.verifier;
      request_options = {
        url: 'http://' + LINE_DOMAIN + LINE_CERTIFICATE_PATH,
        headers: {
          'X-Line-Access': verifier_code
        }
      };

      // Wait for verify http get block
      request(request_options, function (err, response, body) {

        if (!err) {
          // Get authToken
          lc._client.loginWithVerifierForCertificate(verifier_code, function(err, auth_info) {

            if (!err) {
              // Add authToken to header
              lc._header['X-Line-Access'] = auth_info.authToken;

              // Update Revision
              lc._client.getLastOpRevision(function(err, revision) {
                lc._revision = revision;
                _callback_options.success(err, revision);
              });
            } else if (_callback_options.error) {
              _callback_options.error(err);
              console.log(err);
            }
          });
        } else if (_callback_options.error) {
          _callback_options.error(err);
          console.log(err);
        }
      });
    } else if(_callback_options.error) {
      _callback_options.error(err);
      console.log(err);
    }
  });
};

LineClient.prototype.getProfile = function(_callback) {
  this._client.getProfile(function(err, result) {
    _callback(err, result);
  });
};

LineClient.prototype.getAllContactIds = function(_callback) {
  this._client.getAllContactIds(function(err, result) {
    _callback(err, result);
  });
};

LineClient.prototype.getContacts = function(ids, _callback) {
  this._client.getContacts(ids, function(err, result) {
    _callback(err, result);
  });
};

LineClient.prototype.getRecentMessages = function(id, count, _callback) {
  this._client.getRecentMessages(id, count, function(err, result) {

    // Convert contentType to Base64
    for (var i = 0; i < result.length ; i++) {
      if ( result[i].contentPreview != null ) {
        result[i].contentPreview = new Buffer(result[i].contentPreview, 'binary').toString('base64');
        console.log(result[i].contentPreview);
      }
    }

    _callback(err, result);
  });
};

LineClient.prototype.sendSticker = function(id, contentMetadata, _callback) {
  var message = new Message({
    to: id,
    text: '',
    contentType: ContentType.STICKER,
    contentMetadata: contentMetadata
  });

  this._client.sendMessage(id, message, function(error, result) {
    _callback(error, result);
  });
};


LineClient.prototype.sendMessage = function(id, message, _callback) {
  var message = new Message({
    to: id,
    text: message
  });

  this._client.sendMessage(id, message, function(error, result) {
    _callback(error, result);
  });
};

LineClient.prototype.longPoll = function(size, _callback) {
  var lc = this;
  lc._client.fetchOperations(lc._revision, size, function(err, operations) {
    if (!err) {
      for (var i = 0; i < operations.length; i++) {
        lc._revision = (operations[i].revision > lc._revision) ? operations[i].revision : lc._revision;
      }
      _callback(err, operations);
    } else {
      console.log(err);
    }
  });
};

module.exports = LineClient;
