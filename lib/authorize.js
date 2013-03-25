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
  console.log("BEGIN HEADERS:");
  for (var h in headers)
    console.log(h + ": " + headers[h]);
  console.log("END HEADERS:")
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
