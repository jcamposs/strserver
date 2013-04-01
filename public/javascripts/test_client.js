var button = null;
var events = null;
var pannel = null;
var start = null;
var stop = null;
var connection = null;

window.onload = function() {
  button = document.getElementById('connect');
  events = document.getElementById('events');
  pannel = document.getElementById('pannel');

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
      connection = conn;
      println("State: Connected");
      enablePannel();
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

function enablePannel() {
  pannel.style.visibility= "visible";
  start = document.getElementById('start');
  stop = document.getElementById('stop');
  start.onclick = startNodes;
  stop.onclick = stopNodes;
}

//Start machines
function startNodes() {
  var nodes = ["pc0", "s0", "pc1"];
  connection.start(nodes);
}

//Stop machines
function stopNodes() {
  var nodes = ["pc0", "pc1"];
  connection.stop(nodes);
}
