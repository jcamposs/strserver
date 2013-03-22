function print_headers(headers) {
console.log("BEGIN HEADERS:");
  for (var h in headers)
    console.log(h + ": " + headers[h]);
console.log("END HEADERS:")
}

module.exports = function(handshakeData, callback) {
  for (var p in handshakeData) {
    if (p == "headers")
      print_headers(handshakeData[p]);
    else if (p == "address")
      console.log("Client: " + handshakeData[p].address + ":" + handshakeData[p].port);
    else
      console.log(p + ": " + handshakeData[p]);
  }

  //TODO: Check if this user is logged using the cookie set in headers
  callback(null, true);
}
