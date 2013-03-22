/**
 * Module dependencies.
 */

var express = require('express')
  , authorize = require('./lib/authorize.js');

var app = express();

// Configuration
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.static(__dirname + '/public'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser('your secret here'));
  app.use(express.session());
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

var server = require('http').createServer(app)
  , io = require('socket.io').listen(server);

// General configuration
io.configure(function (){
  io.set('authorization', authorize);
});

// Recommended configuration for production
io.configure('production', function(){
  io.enable('browser client minification');
  io.enable('browser client etag');
  io.enable('browser client gzip');
  io.set('log level', 1);
});

var workspace = io
  .of('/workspace')
  .on('connection', function (socket) {
    socket.emit('update', {
        that: 'only'
      , '/workspace': 'will get'
    });
  });

server.listen(9000);
