/**
 * This module encapsulates all AMQP stuff
 */

var amqp = require('amqp')
  , fs = require('fs')
  , logger = require('nlogger').logger(module)
  , nimble = require('nimble')
  , path = require('path')
  , util = require("util");

var env = "development";

var Messenger = function(callback) {
  this._config = {};
  var obj = this;

  nimble.series([
    function(_callback) {
      // Read AMQP configuration file
      logger.debug("Reading AMQP configuration file");
      var conf_file = path.join(__dirname, "../amqp.json");
      fs.readFile(conf_file, 'utf8', function(err, data) {
        if (err) {
          callback(err);
          return;
        }

        try {
          obj._config = JSON.parse(data);
          _callback();
        } catch (err) {
          callback(err);
        }
      });
    },
    function(_callback) {
      // Initialize AMQP stuff
      logger.debug("Connecting AMQP server");
      obj._connection = amqp.createConnection(obj._config);
      obj._connection.on('ready', function () {
        logger.debug("AMQP Ready.");
        obj._exchange = obj._connection.exchange('', { type: 'direct' }, function() {
          logger.debug("Exchange initialized");
        });
      });
      obj._connection.on('close', function (err) {
        logger.warn("AMQP connection closed.");
      });
      obj._connection.on('error', function (err) {
        if (err)
          logger.error(err)
      });
      _callback();
    }
  ], function() {
    /* Everithing is configured */
    logger.debug("AMQP configured");
    callback(null);
  });
}

Messenger.prototype.createWatcher = function(id) {
  return new Watcher(id, this._connection);
}

Messenger.prototype.start = function(req) {
  var rkey = "netlab.services." + env + ".workspace.start";
  this._exchange.publish(rkey, req, {contentType: 'application/json'});
}

module.exports = Messenger;

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
var Watcher = function(id, conn) {
  this._id = id;
  this._connection = conn;
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

  var queue = this._connection.queue('', { exclusive: true }, function (q) {
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
        obj.emit('updated', message.nodes);
        obj._removeSubscription("get");
        obj._listen();
      }
    }).addCallback(function(ok) {
      obj._addSubscription("get", null, q, ok.consumerTag);
    });

    obj._connection.publish(name, { workspace: obj._id}, { replyTo: q.name });
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

  var exchange = this._connection.exchange(name, { type: 'direct' });
  var queue = this._connection.queue('', {
    exclusive: true,
    autoDelete : true
  }, function (q) {
    if (obj._state == state.stop)
      return;

    q.bind(exchange, "");

    q.subscribe(function (message) {
      if (obj._state == state.stop)
        return;

      if (message.workspace != obj._id)
        logger.error("Received invalid workspace id " + message.workspace);
      else
        obj.emit('updated', message.nodes);
    }).addCallback(function(ok) {
      obj._addSubscription("listen", exchange, q, ok.consumerTag);
    });
  });
}
