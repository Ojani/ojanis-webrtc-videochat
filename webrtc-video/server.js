const express = require('express');



const app = express();

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/simplepeer.js", (req, res) => res.sendFile(__dirname + "/node_modules/simple-peer/simplepeer.min.js"));



const PORT = process.env.PORT || 8000;

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

  if(!rooms[roomId]) return res.render("room.ejs", { err: "Room does not exist, the host may have exited the room." });

  rooms[roomId].invite.name = req.body.username;
  res.redirect("/room/"+roomId);

});

//Entering a room
app.get("/room/:roomId", (req, res) => {
  const roomId = req.params.roomId;

  if(!rooms[roomId]) return res.redirect("/");
  if(rooms[roomId].invite.id != null) return res.redirect("/room?id="+roomId);
  var protocol = req.get("host") == "0.0.0.0:"+PORT || req.get("host") == "localhost:"+PORT? "http" : "https";
  res.render("room.ejs", { joinUrl: `${protocol}://${req.get("host")}/room?id=${roomId}`, room: JSON.stringify(rooms[roomId]) });
});






io.on("connection", socket => {
  //Creating room
  socket.on("create-room", username => {
    if(!username) return;
    if(username.replace(" ", "").length < 3) return;

    rooms[socket.id] = { users: {}, host: { name: username }, invite: {}, id: socket.id }

    socket.emit("redirect", "/room/"+socket.id);

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
    try {
      io.to(data.to).emit("hey", { signal: data.signal, from: data.from });
    } catch (err) {
      console.log(err);
      socket.emit("redirect", "/");
    }
  });

  socket.on("setInvite", data => {
    try {
      if(!rooms[data.room]) return;

      rooms[data.room].invite.id = data.id;
      io.to(rooms[data.room].host.id).emit("setInvite", data.id);
      socket.participantOf = data.room;

    } catch (err) {
      console.log(err);
      socket.emit("redirect", "/");
    }
  });

  socket.on("setHost", data => {
    try {
      if(!rooms[data.room]) return;

      rooms[data.room].host.id = socket.id;
      socket.participantOf = data.room;
    } catch (err) {
      console.log(err);
      socket.emit("redirect", "/");
    }

  });

  socket.on("acceptCall", data => {
    try {
      io.to(data.to).emit("callAccepted", data.signal);
    } catch {
      socket.emit("redirect", "/");
    }
  });

  socket.on("message", (txt, roomId, to) => {
    try {
      var room = rooms[roomId];
      var name = room.host.id = socket.id? room.host.name : room.invite.name;
      var msgObj = { msg: txt, name: name }
      io.to(to).emit("message", msgObj);
    } catch (err) {
      console.log(err);
    }
  });

  socket.on("disconnect", () => {
    try {

      if(rooms[socket.participantOf] && rooms[socket.participantOf].host.id == socket.id) {
        delete rooms[socket.participantOf];
      }

    } catch (err) {
      console.log(err);
    }

  });

});


//404 route
app.all("*", (req, res) => {
  res.status(404).render("404.ejs");

});
