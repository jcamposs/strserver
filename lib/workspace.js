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
    logger.info("Connected: " + JSON.stringify(socket.handshake.user));
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
    logger.info("User " + socket.handshake.user.id + " joined to workspace "
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
    message.user = socket.handshake.user.id;
    messenger.connectShell(message);
  });

  // Disconnect shell
  socket.on('shell disconnect', function (message) {
    message.user = socket.handshake.user.id;
    messenger.disconnectShell(message);
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
  this._watcher.on('event', function(message) {
    switch(message.type) {
    case "shell":
      if (message.state == "connected")
        obj._notifyShellConected(message);
      else
        obj._notifyShellDisconected(message);
      break;
    case "state":
    case "update":
      obj._broadcast_updates(message.nodes);
      break;
    }
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
  if (!this._state)
    this._state = {};

  for (var i = 0; i < nodes.length; i++) {
    if (!this._state[nodes[i].name])
      this._state[nodes[i].name] = {};

    if (nodes[i].state)
      this._state[nodes[i].name]["state"] = nodes[i].state;

    if (!nodes[i].interfaces || nodes[i].interfaces.length <= 0)
      continue;

    this._state[nodes[i].name]["interfaces"] = {};

    for (var j = 0; j < nodes[i].interfaces.length; j++) {
      var iface = nodes[i].interfaces[j].interface;
      var ip = nodes[i].interfaces[j].ip;
      this._state[nodes[i].name]["interfaces"][iface] = ip;
    }
  }
}

Workspace.prototype._broadcast_updates = function(nodes) {
  this._update_state(nodes);

  var msg = {
    workspace: this._id,
    nodes: nodes
  };

  /* Send updated nodes to all users registered in this workspace */
  io.of(namespace).in(this._room).emit('updated', msg)
}

Workspace.prototype._notifyShellConected = function(msg) {
  var clients = io.of(namespace).clients(this._room);
  for (var i = 0; i < clients.length; i++) {
    if (!clients[i].workspace && !clients[i].handshake.user)
      continue;

    if (clients[i].handshake.user.id == msg.user) {
      var data = {
        node: msg.node,
        state: msg.state,
        host: msg.host,
        port: msg.port
      };
      clients[i].emit('shell', data);
    }
  }
}

Workspace.prototype._notifyShellDisconected = function(msg) {
  var clients = io.of(namespace).clients(this._room);
  for (var i = 0; i < clients.length; i++) {
    if (!clients[i].workspace && !clients[i].handshake.user)
      continue;

    if (clients[i].handshake.user.id == msg.user) {
      var data = {
        node: msg.node,
        state: msg.state,
      };
      clients[i].emit('shell', data);
    }
  }
}
