var LineClient = require('../lib/line_client');

var line_client = new LineClient();

line_client.login({
  waiting: function(err, result) {
    console.log(result);
  },
  success: function(err, result) {
    line_client.getProfile(function(err, result) {
      //console.log(result);
    });
/*
    line_client.getAllContactIds(function(err, ids) {
      console.log(ids);
      line_client.getContacts(ids, function(err, result) {
        console.log(result);
      });
    });
*/
/*
    line_client.getRecentMessages('u5218451286975ec50c200825dcd31566', 10, function(err, result) {
      console.log(result);
    });
*/
/*
    line_client.sendMessage('u5218451286975ec50c200825dcd31566', '測試測試，如果成功這是從程式傳出來的',
    function(err, result) {
      console.log(err);
      console.log(result);
    });
*/
    console.log('Start Polling');
    setInterval(function() {
      line_client.longPoll(50, function(err, result) {
        //
      });
    }, 3000);
  }
});


/*
line_client.loginAuth();
*/
