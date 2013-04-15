var config = require('konphyg')(__dirname + '/../config')
  , http = require('http')
  , logger = require('nlogger').logger(module);

var config = config('authorize');

module.exports = function(handshakeData, callback) {
  checkAuthenticated(handshakeData.headers, function(error, user) {
    if (error)
      callback(error, false);
    else {
      handshakeData.user = user;
      callback(null, true);
    }
  });
}

function print_headers(headers) {
  logger.info("BEGIN HEADERS:");
  for (var h in headers)
    logger.debug(h + ": " + headers[h]);
  logger.info("END HEADERS:")
}

function checkAuthenticated(headers, callback) {
  cookie = headers.cookie;
  if (!cookie) {
    /* There is no session cookie for this user */
    return callback("User is not authenticated");
  }

  var options = {
    hostname: config.hostname,
    port: config.port,
    path: config.path,
    headers: headers,
    method: config.method
  };

  var req = http.request(options, function(res) {
    if (res.statusCode != 200) {
      /* Could not get user */
      return callback("User is not authenticated");
    }

    res.setEncoding('utf8');
    res.on('data', function (json) {
      try {
        user = JSON.parse(json);
        callback(null, user);
      } catch (err) {
        callback("Unexpected error");
      }
    });
  });

  req.on('error', function(e) {
    console.log('problem with request: ' + e.message);
    callback(e.message);
  });

  req.end();
}

function getLoggedUserDev(headers, callback) {
  print_headers(headers);
  /* TODO: Make a GET user json representation by using the netlab's full */
  /* REST API. We must set the sessionID header so as to check wether this */
  /* user is logged or not. */
  var json = '{"id":1,"name":"Homer","last_name":"Simpon", "email":"homer@test.com"}';
  try {
    var user = JSON.parse(json);
    callback(null, user);
  } catch (err) {
    callback("could not parse json user", null);
  }
}
