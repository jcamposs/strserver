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

    if (!workspaces[message.workspace])
      workspaces[message.workspace] = new Workspace(message.workspace);

    workspaces[message.workspace].add(socket);
  });

  socket.on('start', function (message) {
    /* TODO: Send AMQP start request */
    logger.info("Workspace " + message.workspace + ", Start nodes " + message.nodes);
  });

  socket.on('stop', function (message) {
    /* TODO: Send AMQP stop request */
    logger.info("Workspace " + message.workspace + ", Stop nodes " + message.nodes);
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

/**
 * Workspace class
 */
var Workspace = function(id) {
  this._id = id;
  this._state = {
    workspace: this._id,
    nodes: [
      { name: "pc0", state: "started" },
      { name: "r0", state: "stopped" }
    ]
  };
}

Workspace.prototype.add = function(socket) {
  socket.join('workspace' + this._id);
  socket.handshake.user.workspace = this._id;
  socket.emit('registered', null, { workspace: this._id });

  if (this._state)
    socket.emit('updated', this._state);
}
