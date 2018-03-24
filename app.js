var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var ejs=require('ejs');
var session = require('express-session');
var login_signup = require('./routes/login_signup');
var users = require('./routes/users');
var passport = require('passport');
var multer=require('multer');
var expressValidators=require('express-validator');
var MySQLStore = require('express-mysql-session')(session);


var app = express();
//authentication section
// THIS OPTIONS IS FOR EXPRESS-MYSQL-SESSIONS
var options = {
  host : 'localhost',
  port : 3306,
  user : 'root',
  password: '2020',
  database: 'user',

};
var sessionStore = new MySQLStore(options);
app.set('trust proxy', 1) // trust first proxy
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  store: sessionStore,
  saveUninitialized: false,
  //cookie: { secure: true }
}))

app.use(passport.initialize());
app.use(passport.session());
app.use(expressValidators());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', login_signup);
app.use('/users', users);

app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
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
