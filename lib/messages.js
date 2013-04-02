/**
 * This module encapsulates all AMQP stuff
 */

var amqp = require('amqp')
  , fs = require('fs')
  , logger = require('nlogger').logger(module)
  , nimble = require('nimble')
  , path = require('path');

var config = {}
  , connection = null;

exports.connect = function(callback) {
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
          config = JSON.parse(data);
          _callback();
        } catch (err) {
          callback(err);
        }
      });
    },
    function(_callback) {
      // Initialize AMQP stuff
      logger.debug("Connecting AMQP server");
      connection = amqp.createConnection(config);
      connection.on('ready', function () {
        logger.debug("AMQP Ready.");
      });
      connection.on('close', function (err) {
        logger.warn("AMQP connection closed.");
      });
      connection.on('error', function (err) {
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
