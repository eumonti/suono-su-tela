const canvas = document.querySelector("canvas");
canvas.width = innerHeight;
canvas.height = innerWidth;

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

const trigVolume = 0.5; // Define trigger volume (0 to 1)
let big = true;

const debug = document.getElementById("debug");
const myBar = document.getElementById("myBar");
const myProgress = document.getElementById("myProgress");

const canvasCtx = canvas.getContext("2d");

/**
 * @type {AnalyserNode}
 */
let analyser;
let floatTimeDomainDataArray;
let byteTimeDomainDataArray;
let frequencyDataArray;
let bufferLength;

start();

function start() {
  navigator.mediaDevices
    .getUserMedia({
      audio: {
        mandatory: {
          googEchoCancellation: "false",
          googAutoGainControl: "false",
          googNoiseSuppression: "true",
          googHighpassFilter: "false",
        },
        optional: [],
      },
      video: false,
    })
    .then((stream) => {
      /* AUDIO STUFF */
      // const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const audioCtx = new window.AudioContext();
      analyser = audioCtx.createAnalyser();

      source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      analyser.fftSize = 2048;
      bufferLength = analyser.frequencyBinCount;
      floatTimeDomainDataArray = new Float32Array(bufferLength);
      byteTimeDomainDataArray = new Uint8Array(bufferLength);
      frequencyDataArray = new Uint8Array(bufferLength);

      /* CANVAS STUFF */
      canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
      drawLoop();
      // window.setInterval(() => {
      //   getData();
      //   const avg = average(frequencyDataArray);
      //   myBar.style.width = `${(avg / 256) * 100}%`;
      //   debug.innerText = avg;
      // }, 20);
    });
}

const average = (arr) => arr.reduce((p, c) => p + c) / arr.length;

const rms = (arr) => Math.sqrt(arr.reduce((p, c) => p + c * c) / arr.length);

document.addEventListener("click", () =>
  canvasCtx.clearRect(0, 0, WIDTH, HEIGHT)
);

function drawArray(dataArray) {
  // const big = !!Math.round(Math.random());

  // RGB part
  let color = `rgba(
  ${Math.floor(Math.random() * 255)},
  ${Math.floor(Math.random() * 255)},
  ${Math.floor(Math.random() * 255)},`;
  // const color = "black";

  // ALPHA part
  color += `${big ? Math.random() * 0.2 : 0.8 + Math.random() * 0.2})`;
  console.log(color);

  big
    ? (canvasCtx.lineWidth = 100 + Math.random() * 300)
    : (canvasCtx.lineWidth = Math.random() * 5);

  canvasCtx.strokeStyle = color;

  canvasCtx.beginPath();
  const sliceWidth = (WIDTH * 1.0) / bufferLength;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    let v = dataArray[i] / 128.0;
    let y = HEIGHT - (v * HEIGHT) / 2;

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }

    x += sliceWidth * 10;
  }

  canvasCtx.lineTo(WIDTH, HEIGHT / 2);
  canvasCtx.stroke();
}

function drawWave(dataArray, angle) {
  canvasCtx.beginPath();
  const sliceWidth = (WIDTH * 1.0) / bufferLength;
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    let v = dataArray[i] / 128.0;
    let y = HEIGHT - (v * HEIGHT) / 2;

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y * (i * (1 / bufferLength) * angle));
    }

    x += sliceWidth * 10;
  }

  canvasCtx.lineTo(WIDTH, HEIGHT / 2);
  canvasCtx.stroke();
}

function getData() {
  analyser.getByteTimeDomainData(byteTimeDomainDataArray);
  analyser.getFloatTimeDomainData(floatTimeDomainDataArray);
  analyser.getByteFrequencyData(frequencyDataArray);
}

let trigDate = 0;
function drawLoop() {
  requestAnimationFrame(drawLoop);
  getData();
  const volume = rms(floatTimeDomainDataArray) * 1.4;

  if (volume > trigVolume && Date.now() - trigDate > 1000) {
    console.log("triggered");
    drawArray(frequencyDataArray, 2);
    trigDate = Date.now();
  }
}
