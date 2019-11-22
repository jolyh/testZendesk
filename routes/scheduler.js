var express = require('express');
var router = express.Router();

const credentialsAPI = require('../lib/credentialsAPI');
const autofeed = require('../lib/autofeed');

var call = {
  uri: '',
  headers: {
      'User-Agent': 'Request-Promise',
      'Authorization': "Basic " 
        + Buffer.from(credentialsAPI.userEmail + "/token:" + credentialsAPI.zendeskAPIToken).toString('base64') // to be added to all header to allow auth
  },
  json: true // Automatically parses the JSON string in the response
};

// Retun the timestamp unix of 1 month ago
var oneMonthAgo = function () {
  console.log("Use of one month ago")
  var d = new Date();
  d.setMonth(d.getMonth() - 1);
  return d.valueOf()/1000;
}

/* GET defaul schedule page */
router.get('/', (req, res, next) => {
  res.render('scheduler', { title: "Welcome to scheduler" });
});

router.get('/stop', (req, res, next) => {
  autofeed.stopAutofeed();
  res.render('scheduler', { title : "Scheduler stopped" });
});

router.get('/setup', (req, res, next) => {
  res.render('schedulefeed', {});
});

router.post('/setup', (req, res, next) => {

  req.body = JSON.parse(JSON.stringify(req.body));
  console.log('minute:' + req.body.minute + 'q');
  
  var includeArray = [];
  if (req.body.metrics == 'on') {
    includeArray.push('metric_sets')
  }
  if (req.body.users == 'on') {
    includeArray.push('users')
  }
  if (req.body.groups == 'on') {
    includeArray.push('groups')
  }

  var recurrence = "* " 
  + (req.body.minute == ''? "*" : req.body.minute) + " " 
  + (req.body.hour == ''? "*" : req.body.hour) + " " 
  + (req.body.date == ''? "*" : req.body.date) + " " 
  + (req.body.month == ''? "*" : req.body.month)
  console.log(recurrence)

  //incremental.allDataFromIncrementalCallWithRender(call, res)
  autofeed.setupNewAutofeed(recurrence, req.body.datatype, includeArray);

  res.render('schedulefeed', {})
});

/* ERROR */

router.get('*', (req, res) => {
  res.render('index', {title: "the landing page, you lost soul"});
});

module.exports = router;
