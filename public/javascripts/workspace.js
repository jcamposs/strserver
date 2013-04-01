/**
 *
 *  Copyright (C) 2012 GSyC/LibreSoft, Universidad Rey Juan Carlos.
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation; either version 2 of the License, or
 *  (at your option) any later version.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, write to the Free Software
 *  Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
 */

/**
 * Workspace Module
 */
var Workspace = (function () {

  var socket = null;

  EventEmitter = function(isValid) {
    var obj = {};
    var events = {};
    var func = (isValid != null) ? isValid : function(evt) { return false };

    obj.on = function(evt, handler) {
      if (!func(evt))
        return;

      if (!events[evt])
        events[evt] = [];

      events[evt].push(handler);
    }

    obj.emit = function() {
      if (arguments.length <= 0)
        return;

      var evt = arguments[0];

      if (!events[evt])
        return;

      var args = [];

      for (var i = 1; i < arguments.length; i++)
        args.push(arguments[i]);

      for (var i = 0; i < events[evt].length; i++)
        events[evt][i].apply(this, args);
    }

    return obj;
  }

  /**
   * Workspace connection object
   */
  Connection = function() {
    function isValid(evt) {
      switch (evt) {
      case "joined":
        return true;
      default:
        console.log("Invalid event " + evt);
        return false;
      }
    }

    var obj = EventEmitter(isValid);
    var wid = null;

    obj.joinWorkspace = function(id) {
      socket.emit('register', { workspace: id});
    }

    /**
     * Send a request to start nodes specified in the array nodes.
     * If nodes are started, the event "started" is emitted.
     * Return true if request could be sent.
     */
    obj.start = function(nodes) {
      if (!wid) {
        console.log("Workspace is not registered");
        return false;
      }

      socket.emit('start', { workspace: wid, nodes: nodes });
      return true;
    }

    /**
     * Send a request to stop nodes specified in the array nodes.
     * If nodes are stopped, the event "stopped" is emitted.
     * Return true if request could be sent.
     */
    obj.stop = function(nodes) {
      if (!wid) {
        console.log("Workspace is not registered");
        return false;
      }

      socket.emit('stop', { workspace: wid, nodes: nodes });
      return true;
    }

    /**
     * Send a request to connect this user with a node.
     * If the shell is started, the event "shell connected" is emitted.
     * Return true if request could be sent.
     */
    obj.connectShell = function(node) {
      if (!wid) {
        console.log("Workspace is not registered");
        return false;
      }

      socket.emit('shell connect', { workspace: wid, node: node });
      return true;
    }

    /**
     * Send a request to disconnect this user from a node.
     * If the shell is stopped, the event "shell disconnected" is emitted.
     * Return true if request could be sent.
     */
    obj.disconnectShell = function(node) {
      if (!wid) {
        console.log("Workspace is not registered");
        return false;
      }

      socket.emit('shell disconnect', { workspace: wid, node: node });
      return true;
    }

    socket.on('registered', function (err, data) {
      if (!err)
        wid = data.workspace;

      obj.emit("joined", err, data);
    });

    return obj;
  };

  var module = {};

  /**
   * Connect to worksace streaming server. This function has only a callback,
   * parameter that requires two arguments, error which can be undefined or a
   * String in case of the error and a Connection object if connection is
   * successful.
   */
  module.connect = function(callback) {
    socket = io.connect('/workspace');
    var _cb = function(err, obj) {
      socket.removeListener('error', errorL);
      socket.removeListener('connect', connectL);
      callback(err, obj);
    };

    /* define some listeners */
    var connectL = function (){
      _cb(null, Connection(socket));
    };

    var errorL = function (reason) {
      _cb('Unable to connect with workspace streaming server', null);
    };

    socket.on('error', errorL);
    socket.on('connect', connectL);
  }

  return module;
}());
