var button = null;
var events = null;
var pannel = null;
var start = null;
var stop = null;
var connection = null;

/* Testing parameters */
var workspace_id = 1;
var nodes = ["pc0", "s0", "pc1"];

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
      println("Connected");
      enablePannel();
      addListeners();
      println("Registering...");
      connection.joinWorkspace(workspace_id);
    }
  });
}

function println(str) {
  events.value += str + "\n";
}

function addListeners() {
  /* Joined is emitted when we are registered for workspace events */
  connection.on("joined", function(err, data){
    if (err)
      println("Error: " + err);
    else
      println("Registered in workspace " + data["workspace"]);
  });

  /* We want to know when the streaming connection is closed */
  connection.on("disconnected", function(){
    println("Server disconnected");
  });

  /* We want to know when the streaming connection is reconnected */
  connection.on("connected", function(){
    println("Server reconnected");

    connection.joinWorkspace(workspace_id);
  });

  /* We want to get state updates */
  connection.on("updated", function(data){
    println("Updated: " + JSON.stringify(data));
  });
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
  connection.start(nodes);
}

//Stop machines
function stopNodes() {
  connection.stop(nodes);
}
