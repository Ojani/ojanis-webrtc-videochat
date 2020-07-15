if(window.location.hostname == "localhost") {
  var socket = io.connect("http://localhost:"+location.port);

} else {
  var socket = io.connect(window.location.hostname);

}



socket.on("connect", () => {

socket.on("redirect", url => {
  window.location = url;
});

var streaming;
var caller;
var stream;
const yourId = socket.id;
var peerId;

if(Room.host.id == null) {
  socket.emit("setHost", { id: yourId , room: Room.id});

  socket.on("setInvite", id => {
    peerId = id;
    callPeer();
  });

}
else {
  socket.emit("setInvite", { id: yourId, room: Room.id });
  peerId = Room.host.id;
}






const localStream = document.querySelector(".localStream")
const externalStream = document.querySelector(".externalStream")


const constraints = {
  audio: true,
  video: {
    height: { ideal: window.innerWidth/1.75 },
    width: { ideal: window.innerWidth }
  }

}

navigator.mediaDevices.getUserMedia(constraints)

.then(videoStream => {
  localStream.srcObject = videoStream;
  localStream.onloadedmetadata = () => localStream.play();

  stream = videoStream;

})
.catch(err => {
  console.log(err);

});

function callPeer() {
  const peer = new SimplePeer({
    initiator: true,
    terickle: false,
    stream: stream
  });

  peer.on("signal", data => {
    socket.emit("callUser", {signal: data, to: peerId, from: yourId});
  });

  peer.on("stream", stream => {
    externalStream.style.display = "block";
    externalStream.srcObject = stream;
    externalStream.onloadedmetadata = () => externalStream.play();
  });

  socket.on("callAccepted", signal => {
    peer.signal(signal);
  });

}

function acceptCall(callerSignal, caller) {
  const peer = new SimplePeer({
    initiator: false,
    trickle: false,
    stream: stream
  });

  peer.on("signal", data => {
    socket.emit("acceptCall", { signal: data, to: caller });
  });

  peer.on('stream', stream => {
    streaming = true;
    externalStream.style.display = "block";
    externalStream.srcObject = stream;
    externalStream.play();
  });

  if(!streaming) peer.signal(callerSignal);

}

socket.on("hey", data => {
  acceptCall(data.signal, data.from);

});


document.querySelector(".textForm").onsubmit = e => submitText(e);
document.querySelector(".sendMsgBtn").onclick = () => submitText();

//Messaging
function submitText(e=undefined) {
  if(e) {
    e.preventDefault();
  }

  const text = document.querySelector(".textInput").value;
  document.querySelector(".textInput").value = "";
  const messageObj = { local:true, msg: text }

  appendMessage(messageObj);
  socket.emit("message", text, Room.id, peerId);

}

socket.on("message", msg => {
  appendMessage(msg);
});

function appendMessage(msg) {
  var p = document.createElement("p");
  p.className = "message";
  var name = document.createElement("span");
  var txt = document.createElement("span");

  txt.innerText = msg.msg;

  if(msg.local) {
    name.innerText = "You";
    name.className = "name local";
  } else {
    name.innerText = msg.name;
    name.className = "name external";
  }
  p.append(name);
  p.append(": ");
  p.append(txt);

  document.querySelector(".messagesWrapper").append(p);

}

});
