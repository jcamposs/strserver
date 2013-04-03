/**
 * Module dependencies.
 */

var authorize = require('./lib/authorize.js')
  , express = require('express')
  , logger = require('nlogger').logger(module)
  , Messenger = require('./lib/messenger.js')
  , nimble = require('nimble')
  , workspace = require('./lib/workspace.js');

var app = null
  , messenger = null
  , server = null
  , io = null

/* Server initialization */
nimble.series([
  function(_callback) {
    /* Configure messaging system */
    messenger = new Messenger(function(err) {
      if (err)
        logger.error(err);
      else
        _callback()
    });
  },
  function(_callback) {
    /* Configuration for the application */
    app = express();

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

    _callback();
  },
  function(_callback) {
    /* SocketIO server configuration */
    server = require('http').createServer(app);
    io = require('socket.io').listen(server);

    /* General configuration */
    io.configure(function (){
      io.set('authorization', authorize);
    });

    /* Recommended configuration for production */
    io.configure('production', function(){
      io.enable('browser client minification');
      io.enable('browser client etag');
      io.enable('browser client gzip');
      io.set('log level', 1);
    });

    _callback();
  },
  function(_callback) {
    /* Attend workspace notifications */
    workspace.attend(io);

    _callback();
  }
], function() {
  /* Everithing is configured */
  server.listen(9000);
});
