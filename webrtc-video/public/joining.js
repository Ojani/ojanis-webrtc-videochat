if(window.location.hostname == "localhost") {
  var socket = io.connect("http://localhost:"+location.port);

} else {
  var socket = io.connect(window.location.hostname);

}

socket.on("redirect", url => {
  location.href = url;

});

//Sending socket id with post
socket.on("connect", () => {
  sessionStorage.setItem("id", socket.id)
  document.querySelector("input[name='socketid']").value = socket.id;
  document.body.removeChild(document.querySelector(".loadingScreen"));

});
