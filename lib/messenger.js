/**
 * This module encapsulates all AMQP stuff
 */

var amqp = require('amqp')
  , fs = require('fs')
  , logger = require('nlogger').logger(module)
  , nimble = require('nimble')
  , path = require('path')
  , util = require("util");

var Messenger = function(callback) {
  this._config = {};
  this._connection = null;
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
      });
      obj._connection.on('close', function (err) {
        logger.warn("AMQP connection closed.");
      });
      obj._connection.on('error', function (err) {
        if (err)
          logger.error(err)
      });
      _callback();
    },
  ], function() {
    /* Everithing is configured */
    logger.debug("AMQP configured");
    callback(null);
  });
}

Messenger.prototype.createWatcher = function(id) {
  return new Watcher(id, this._connection);
}

module.exports = Messenger;

/**
 * Message watcher class
 * This class will listen for messages regarding the workspace id in the proper
 * AMQP queue. It will emmit an update event whenever something happens in this
 * workspace
 */
var Watcher = function(id, conn) {
  this._id = id;
  this._connection = conn;
}

util.inherits(Watcher, require('events').EventEmitter);

Watcher.prototype.watch = function() {
  //var name = app.settings.env;
  logger.info("Watching on queue: " + process.env.NODE_ENV);
  /*
  this._queue = this._connection.queue('', function (queue) {
    console.log('Queue ' + queue.name + ' is open');
  });
  */
}
