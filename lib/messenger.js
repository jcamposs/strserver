/**
 * This module encapsulates all AMQP stuff
 */

var amqp = require('amqp')
  , config = require('konphyg')(__dirname + '/../config')
  , fs = require('fs')
  , logger = require('nlogger').logger(module)
  , nimble = require('nimble')
  , path = require('path')
  , util = require("util");

var env = (!process.env.NODE_ENV) ? "development" : process.env.NODE_ENV;
var config = config('amqp');
var connection = null;
var exchange = null;

exports.create = function(callback) {
  nimble.series([
    function(_callback) {
      // Initialize AMQP stuff
      logger.debug("Connecting AMQP server");
      connection = amqp.createConnection(config);
      connection.on('ready', function () {
        logger.debug("AMQP Ready.");
        exchange = connection.exchange('', { type: 'direct' }, function() {
          logger.debug("Exchange initialized");
        });
      });
      connection.on('close', function (err) {
        logger.warn("AMQP connection closed.");
      });
      connection.on('error', function (err) {
        if (err)
          logger.error(err)
      });
      _callback();
    }
  ], function() {
    /* Everithing is configured */
    logger.debug("AMQP configured");
    callback(null, new Messenger());
  });
}

var Messenger = function() {
}

Messenger.prototype.createWatcher = function(id) {
  return new Watcher(id);
}

Messenger.prototype.start = function(req) {
  var rkey = "netlab.services." + env + ".workspace.start";
  exchange.publish(rkey, req, {contentType: 'application/json'});
}

Messenger.prototype.stop = function(req) {
  var rkey = "netlab.services." + env + ".workspace.stop";
  exchange.publish(rkey, req, {contentType: 'application/json'});
}

Messenger.prototype.connectShell = function(req) {
  var rkey = "netlab.services." + env + ".shellinabox.connect";
  exchange.publish(rkey, req, {contentType: 'application/json'});
}

Messenger.prototype.disconnectShell = function(req) {
  var rkey = "netlab.services." + env + ".shellinabox.disconnect";
  exchange.publish(rkey, req, {contentType: 'application/json'});
}

var state = {
  stop: 0,
  updating: 1,
  watching: 2
};

/**
 * Message watcher class
 * This class will listen for messages regarding the workspace id in the proper
 * AMQP queue. It will emmit an update event whenever something happens in this
 * workspace
 */
var Watcher = function(id) {
  this._id = id;
  this._state = state.stop;
  this._subscriptions = {};
}

util.inherits(Watcher, require('events').EventEmitter);

Watcher.prototype.watch = function() {
  if (this._state > state.stop)
    return;
  else
    this._state = state.updating;

  var obj = this;
  var name = "netlab.services." + env + ".workspace.state";

  var queue = connection.queue('', { exclusive: true }, function (q) {
    if (obj._state == state.stop)
      return;

    q.bind("");

    q.subscribe(function (message) {
      if (obj._state == state.stop)
        return;

      if (message.workspace != obj._id)
        logger.error("Received invalid workspace id " + message.workspace);
      else if (message.status != "success")
        logger.error("Error: " + message.cause);
      else {
        var data = {
          workspace: obj._id,
          type: "state",
          nodes: message.nodes
        };

        obj.emit('event', data);
        obj._removeSubscription("get");
        obj._listen();
      }
    }).addCallback(function(ok) {
      obj._addSubscription("get", null, q, ok.consumerTag);
    });

    connection.publish(name, { workspace: obj._id}, { replyTo: q.name });
  });
}

Watcher.prototype.stop = function() {
  this._state = state.stop;

  for(var id in this._subscriptions)
    this._removeSubscription(id);
}

Watcher.prototype._addSubscription = function(id, exc, q, t) {
  this._subscriptions[id] = {
    exchange: exc,
    queue: q,
    tag: t
  }
}

Watcher.prototype._removeSubscription = function(id) {
  var s = this._subscriptions[id];

  if (!s)
    return;

  if (s.exchange)
    s.queue.unbind(s.exchange, "");
  else
    s.queue.unbind("");

  s.queue.unsubscribe(s.tag);
  delete this._subscriptions[id];
}

Watcher.prototype._listen = function() {
  if (this._state == state.stop)
    return;

  this._state = state.watching;

  var name = "netlab.events." + env + ".workspace." + this._id;
  var obj = this;

  var exc = connection.exchange(name, { type: 'direct' });
  var queue = connection.queue('', {
    exclusive: true,
    autoDelete : true
  }, function (q) {
    if (obj._state == state.stop)
      return;

    q.bind(exc, "");

    q.subscribe(function (message) {
      if (obj._state == state.stop)
        return;

      if (message.workspace != obj._id)
        logger.error("Received invalid workspace id " + message.workspace);
      else
        obj.emit('event', message);
    }).addCallback(function(ok) {
      obj._addSubscription("listen", exc, q, ok.consumerTag);
    });
  });
}
