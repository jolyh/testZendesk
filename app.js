var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// Start of the autofeed
var autofeed = require('./lib/autofeed');
autofeed.defaultFeed()
/*
var reccurrence = new schedule.RecurrenceRule();
reccurrence.date = 1; // recurrence every 1st day of the month
reccurrence.hour = 12; // at 12
var scheduledFeedback = schedule.scheduleJob(reccurrence, incremental.allTicketSince) // Will get every ticket since last month, every month
//setInterval(incremental.allTicketFeed, 15000); // get all tk
setInterval(incremental.allTicketsSince, 700000, -1, false); // get all tk since last month
*/

var indexRouter = require('./routes/index');
var queryRouter = require('./routes/query');
var incrementalRouter = require('./routes/incremental');
var feedRouter = require('./routes/scheduler');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/query', queryRouter);
app.use('/incremental', incrementalRouter);
app.use('/scheduler', feedRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
