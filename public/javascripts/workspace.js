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

  /**
   * Workspace connection object
   */
  Connection = function(sock) {
    var obj = {};
    var socket = sock;
    var wid = null;

    obj.joinWorkspace = function(id) {
      console.log("Registering to workspace " + id);
      socket.emit('register', { workspace: id});
    }

    socket.on('registered', function (data) {
      wid = data.workspace;
      console.log("User registered: " + data.workspace);
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
    var socket = io.connect('/workspace');
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
