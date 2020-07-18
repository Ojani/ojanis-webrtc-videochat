if(window.location.hostname == "localhost") {
  var socket = io.connect("http://localhost:"+location.port);

} else {
  var socket = io.connect(window.location.hostname);

}


const prevElmnt = document.querySelector(".preview");
var stream;


const mediaConfig = {
  audio: true,
  video: {
    mediaSource: "screen"
  }
}

function getMediaStream() {
  return new Promise((resolve, reject) => {
    try {
      navigator.mediaDevices.getDisplayMedia(mediaConfig)
      .then(stream => {
        resolve(stream);

      })
      .catch(err => {
        reject(err);
      });

    } catch(err) {
      reject(err);

    }

  });

}


async function startStreaming() {
  try {
    stream = await getMediaStream();

    prevElmnt.srcObject = stream;
    prevElmnt.onloadedmetadata = () => prevElmnt.play();

  } catch(err) {
    alert(err);

  }

}


const startBtn = document.querySelector(".startBtn");
const stopBtn = document.querySelector(".stopBtn");
var recorder;

startBtn.onclick = startRecording;

function startRecording() {
  stopBtn.style.display = "inline-block";
  startBtn.style.display = "none";

  recorder = new MediaRecorder(stream);
  socket.emit("started-stream");
  recorder.ondataavailable = chunk => socket.emit("chunk-available", chunk.data);
  recorder.start();

}

stopBtn.onclick = startRecording;

function stopRecording() {
  stopBtn.style.display = "none";
  startBtn.style.display = "inline-block";

  recorder.stop();
  socket.emit("stopped-stream");
}

startStreaming();
