var connect_b = null;
var shell_connect_b = null;
var shell_disconnect_b = null;
var events = null;
var pannel = null;
var start = null;
var stop = null;
var connection = null;
var connected = false;

/* Testing parameters */
var workspace_id = 1;
var nodes = ["pc0"];

window.onload = function() {
  connect_b = document.getElementById('connect');
  shell_connect_b = document.getElementById('shellconnect');
  shell_disconnect_b = document.getElementById('shelldisconnect');
  events = document.getElementById('events');
  pannel = document.getElementById('pannel');

  println("Disconnected");

  // Enable button so that we can connect the socket
  connect_b.disabled = false;
  connect_b.onclick = connect;
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
      connected = true;
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
    connected = false;
  });

  /* We want to know when the streaming connection is reconnected */
  connection.on("connected", function(){
    println("Server reconnected");
    connected = true;
    connection.joinWorkspace(workspace_id);
  });

  /* We want to get state updates */
  connection.on("updated", function(data){
    println("Updated: " + JSON.stringify(data));
    updateShellConnectButton(nodes[0], data.nodes);
  });

  /* We want to get shellinabox notifications */
  connection.on("shell", function(data){
    println("Shell: " + JSON.stringify(data));
    if (data.node != nodes[0])
      return;

    if (data.state == "connected") {
      shell_connect_b.disabled = true;
      shell_disconnect_b.disabled = false;
    } else {
      shell_connect_b.disabled = false;
      shell_disconnect_b.disabled = true;
    }
  });
}

function updateShellConnectButton(node, nodes) {
  for(var i = 0; i < nodes.length; i++) {
    if (nodes[i].name == node) {
      if (nodes[i].state == "halted") {
        shell_connect_b.disabled = true;
      } else if (nodes[i].state == "started") {
        shell_connect_b.disabled = false;
      }
    }
  }
}

function enablePannel() {
  pannel.style.visibility= "visible";
  start = document.getElementById('start');
  stop = document.getElementById('stop');
  start.onclick = startNodes;
  stop.onclick = stopNodes;
  shell_connect_b.onclick = connect_shell;
  shell_disconnect_b.onclick = disconnect_shell;
}

//Start machines
function startNodes() {
  if (!connected)
    alert("Server disconnected");
  else
    connection.start(nodes);
}

//Stop machines
function stopNodes() {
  if (!connected)
    alert("Server disconnected");
  else
    connection.stop(nodes);
}

//Connect shellinabox terminal
function connect_shell() {
  if (!connected)
    alert("Server disconnected");
  else
    connection.connectShell(nodes[0]);
}

//Disconnect shellinabox terminal
function disconnect_shell() {
  //TODO:
}
