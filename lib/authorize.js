var logger = require('nlogger').logger(module);

module.exports = function(handshakeData, callback) {
  getLoggedUser(handshakeData.headers, function(error, user) {
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

function getLoggedUser(headers, callback) {
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
