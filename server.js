var express = require('express');
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
  .of('/events/workspace')
  .on('connection', function (socket) {
    socket.emit('update', {
        that: 'only'
      , '/workspace': 'will get'
    });
  });

server.listen(9000);

function print_headers(headers) {
console.log("BEGIN HEADERS:");
  for (var h in headers)
    console.log(h + ": " + headers[h]);
console.log("END HEADERS:")
}

function authorize(handshakeData, callback) {
  for (var p in handshakeData) {
    if (p == "headers")
      print_headers(handshakeData[p]);
    else if (p == "address")
      console.log("Client: " + handshakeData[p].address + ":" + handshakeData[p].port);
    else
      console.log(p + ": " + handshakeData[p]);
  }

  //TODO: Check if this user is logged using the cookie set in headers
  callback(null, true);
}
