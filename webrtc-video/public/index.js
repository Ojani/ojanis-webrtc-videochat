if(window.location.hostname == "localhost") {
  var socket = io.connect("http://localhost:"+location.port);

} else {
  var socket = io.connect(window.location.hostname);

}

socket.on("connect", () => {
  document.querySelector(".loadingScreen").style.display = "none";
  sessionStorage.setItem("id", socket.id);
});

socket.on("redirect", url => {
  location.href = url;

});

//Creating room
document.querySelector(".createForm").addEventListener("submit", e => {
  e.preventDefault();
  document.querySelector(".loadingScreen").style.display = "block";
  socket.emit("create-room", document.querySelector(".nameInput").value);

});
