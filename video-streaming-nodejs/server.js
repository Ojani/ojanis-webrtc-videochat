const express = require('express');
const fs = require('fs');

const app = express();

app.set("views", "./views");
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, err => {
  if(err) console.log(err);
  console.log(`starting server at: 0.0.0.0:${PORT}`);

});

const io = require('socket.io')(server);


app.get("/", (req, res) => {
  res.render("index.ejs");

});



var writeStream;

io.on("connection", socket => {
  socket.on("started-stream", () => {
    writeStream = fs.createWriteStream(__dirname+"/video.mp4");

  });

  socket.on("chunk-available", chunk => {
    writeStream.write(chunk);

  });

  socket.on("stopped-stream", () => {
    writeStream.end();

  });

});


// read stream
app.get("/stream", (req, res) => {
  var path = __dirname+"/video.mp4";
  var stat = fs.statSync(path);

  res.writeHead(200, {
        'Content-Type': 'audio/mpeg',
        'Content-Length': stat.size
    });

    var readStream = fs.createReadStream(path);

    readStream.pipe(res);

});
