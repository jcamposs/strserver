var button = null;
var events = null;
var connection = null;

window.onload = function() {
  button = document.getElementById('connect');
  events = document.getElementById('events');

  println("Disconnected");

  // Enable button so that we can connect the socket
  button.disabled = false;
  button.onclick = connect;
}

function connect() {
  if (connection != null) {
    alert("Connection is already opened");
    return;
  }

  println("Connecting...");

  Workspace.connect(function(error, conn) {
    if (error)
      println("Error: " + error);
    else {
      println("State: Connected");
      connection = conn;
      connection.on("joined", function(err, data){
        if (err)
          println("Error: " + err);
        else
          println("Registered in workspace " + data["workspace"]);
      });
      println("Registering...");
      connection.joinWorkspace(1);
    }
  });
}

function println(str) {
  events.value += str + "\n";
}