var logger = require('nlogger').logger(module);

var workspace;

exports.attend = function(io) {
 workspace = io
  .of('/workspace')
  .on('connection', function (socket) {
    logger.info("Connected: " + socket.handshake.user.name);
    socket.emit('update', {
        that: 'only'
      , '/workspace': 'will get'
    });
  });
}
