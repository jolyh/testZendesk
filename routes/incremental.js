var express = require('express');
var router = express.Router();

const rp = require('request-promise');
const credentialsAPI = require('../lib/credentialsAPI');
const ticket = require('../lib/ticket');
const incremental = require('../lib/incremental');


// test var
var queryResult = [];

// setup of the call
var call = {
  uri: '',
  headers: {
      'User-Agent': 'Request-Promise',
      'Authorization': "Basic " 
        + Buffer.from(credentialsAPI.userEmail 
        + "/token:" 
        + credentialsAPI.zendeskAPIToken).toString('base64') // to be added to all header to allow auth
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

/* GET defaul query page */
router.get('/', function(req, res, next) {
  res.render('APIIncrementalCallCreate', {title: "Incremental call creation"});
});

router.post('/', function(req, res, next) {

  //console.log(req);

  req.body = JSON.parse(JSON.stringify(req.body));
  
  let startTime = new Date(req.body.startDate + 'T' + req.body.startTime);
  startTime = startTime.valueOf() / 1000;

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

  console.log("post scheduler setup: " + startTime)
  incremental.allDataOfTypeSince(startTime, req.body.datatype, includeArray)

  res.render('APIIncrementalCallCreate', {title: "Incremental call executed"});
});

router.get('*', (req, res) => {
  res.render('index', {title: "the landing page, you lost soul"});
});

module.exports = router;
