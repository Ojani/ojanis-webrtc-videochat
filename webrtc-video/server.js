const express = require('express');



const app = express();

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/simplepeer.js", (req, res) => res.sendFile(__dirname + "/node_modules/simple-peer/simplepeer.min.js"));



const PORT = 8000;

const server = app.listen(PORT, function(err) {
  if (err) return console.log(err);
  console.log("Listening at http://0.0.0.0:%s", PORT);
});


const rooms = {};

const io = require('socket.io')(server);


//Home page
app.get("/", (req, res) => {
  res.render("index.ejs");

});

//Joining a room
app.post("/", verifyId, (req, res) => {
  const { roomId } = req.body;
  res.redirect("/room?id="+roomId);

});


app.get("/room", (req, res) => {
  if(!req.query.id) return res.render("index.ejs", { err: "Room does not exist, the host may have exited the room." });
  res.render("joining.ejs", { id: req.query.id });

});

app.post("/room/:roomId", verifyUsername, (req, res) => {
  const roomId = req.params.roomId;
  const socketId = req.body.socketid;

  if(!socketId) return res.render("room.ejs", { err: "An unexcpected error has occurred." });
  if(!rooms[roomId]) return res.render("room.ejs", { err: "Room does not exist, the host may have exited the room." });

  rooms[roomId].users[socketId] = { username: req.body.username, room: roomId };
  res.redirect("/room/"+roomId+"?userid="+socketId);

});

//Entering a room
app.get("/room/:roomId", (req, res) => {
  const roomId = req.params.roomId;
  const userId = req.query.userid;

  if(!rooms[roomId]) return res.redirect("/");
  if(!rooms[roomId].users[userId]) return res.redirect("/room?id="+roomId);

  res.render("room.ejs", { joinUrl: `${req.protocol}://${req.get("host")}/room?id=${roomId}`, room: JSON.stringify(rooms[roomId]) });
});






io.on("connection", socket => {
  //Creating room
  socket.on("create-room", username => {
    if(!username) return;
    if(username.replace(" ", "").length < 3) return;

    rooms[socket.id] = { users: {}, host: { id: socket.id }, id: socket.id }
    rooms[socket.id].users[socket.id] = { username: username, room: socket.id };

    socket.emit("redirect", "/room/"+socket.id+"?userid="+socket.id);

  });

});





//MIDDLEWARE

//Verifying user input middleware
function verifyId(req, res, next) {
  if(!rooms[req.body.roomId]) return res.render("index.ejs", { err: "Room does not exist, the host may have exited the room." });
  next();
}

//Verifying username middleware
function verifyUsername(req, res, next) {
  const { username } = req.body;
  if(!username) return res.render("index.ejs", { err: "Name must be between 3 and 20 characters long." });
  if(username.replace(" ", "").length < 3) return res.render("room.ejs", { err: "Name must be between 3 and 20 characters long." });

  next();
}






//WEBRTC Signaling
io.on("connection", socket => {
  socket.on('callUser', data => {
    io.to(data.to).emit("hey", { signal: data.signal, from: data.from });
  });

  socket.on("setInvite", data => {
    io.to(data.to).emit("setInvite", data.id);
  });

  socket.on("setHost", data => {
    rooms[data.to].host = { id: data.id }
  });

  socket.on("acceptCall", data => {
    io.to(data.to).emit("callAccepted", data.signal);
  });

});
