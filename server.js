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

server.listen(9000);

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'World' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});
