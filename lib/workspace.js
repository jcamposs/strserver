var logger = require('nlogger').logger(module);

var io;
var workspace;
var workspaces = {};
var messenger = null;

var namespace = '/workspace';

exports.attend = function(sockio, msg) {
 io = sockio;
 messenger = msg;
 workspace = io
  .of(namespace)
  .on('connection', function (socket) {
    logger.info("Connected: " + socket.handshake.user.name);
    configureAPI(socket);
  });
}

function configureAPI(socket) {
  socket.on('disconnect', function() {
    logger.info("User disconnected");
    if (workspaces[socket.workspace])
      workspaces[socket.workspace].remove(socket);
  });

  socket.on('register', function (message) {
    /* TODO: Add AMQP listener for the workspace */
    logger.info("User " + socket.handshake.user.name + " joined to workspace "
                                                           + message.workspace);

    if (!workspaces[message.workspace])
      workspaces[message.workspace] = new Workspace(message.workspace);

    workspaces[message.workspace].add(socket);
  });

  socket.on('start', function (message) {
    message.user = socket.handshake.user.id;
    messenger.start(message);
  });

  socket.on('stop', function (message) {
    message.user = socket.handshake.user.id;
    messenger.stop(message);
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
  this._room = 'workspace' + this._id;
  this._state = null;
  this._watcher = messenger.createWatcher(this._id);

  var obj = this;
  this._watcher.on('updated', function(nodes) {
    obj._broadcast_updates(nodes);
  });

  this._watcher.watch();
}

Workspace.prototype.add = function(socket) {
  socket.join(this._room);
  socket.workspace = this._id;
  socket.emit('registered', null, { workspace: this._id });

  if (this._state) {
    var msg = {
      workspace: this._id,
      nodes: this._format_state()
    };

    socket.emit('updated', msg);
  }
}

Workspace.prototype.remove = function(socket) {
  delete socket.workspace;
  socket.leave(this._room);

  if (io.of(namespace).clients(this._room).length > 0)
    return;

  this._watcher.stop();
  this._watcher = null;
  delete workspaces[this._id];
}

Workspace.prototype._format_state = function() {
  var array = [];

  for (var e in this._state)
    array.push({ name: e, state: this._state[e] });

  return array;
}

Workspace.prototype._update_state = function(nodes) {
  var updated = [];

  if (!this._state) {
    this._state = {};
    for (var i = 0; i < nodes.length; i++)
      this._state[nodes[i].name] = nodes[i].state;
    updated = nodes;
  } else {
    for (var i = 0; i < nodes.length; i++) {
      if (!this._state[nodes[i].name])
        continue;
      if (this._state[nodes[i].name] != nodes[i].state) {
        this._state[nodes[i].name] = nodes[i].state;
        updated.push(nodes[i]);
      }
    }
  }

  return updated;
}

Workspace.prototype._broadcast_updates = function(nodes) {
  var updated = this._update_state(nodes);

  if (updated.length <= 0)
    return;

  var msg = {
    workspace: this._id,
    nodes: updated
  };

  /* Send updated nodes to all users registered in this workspace */
  io.of(namespace).in(this._room).emit('updated', msg)
}
