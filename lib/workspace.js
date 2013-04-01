var logger = require('nlogger').logger(module);

var io;
var workspace;
var clients = {};
var workspaces = {};

exports.attend = function(sockio) {
 io = sockio;
 workspace = io
  .of('/workspace')
  .on('connection', function (socket) {
    logger.info("Connected: " + socket.handshake.user.name);
    configureAPI(socket);
  });
}

function configureAPI(socket) {
  socket.on('register', function (message) {
    /* TODO: Add AMQP listener for the workspace */
    logger.info("User " + socket.handshake.user.name + " joined to workspace "
                                                           + message.workspace);
    workspaces[socket.id] = message.workspace;
    socket.emit('registered', null, { workspace: message.workspace });
  });

  socket.on('start', function (message) {
    /* TODO: Send AMQP start request */
    logger.info("Start nodes " + message.nodes);
  });

  socket.on('stop', function (message) {
    /* TODO: Send AMQP stop request */
    logger.info("Stop nodes " + message.nodes);
  });

  // Connect shell
  socket.on('shell connect', function (message) {
    /* TODO: Send AMQP connect shell request */
    logger.info("User " + socket.handshake.user.name
                              + " wants to connect a shell to " + message.node);
  });

  // Disconnect shell
  socket.on('shell disconnect', function (message) {
    /* TODO: Send AMQP close shell request */
    logger.info("User " + socket.handshake.user.name
                    + " wants to close the shell connected in " + message.node);
  });
}
