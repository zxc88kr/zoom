const socket = io();

const myFace = document.getElementById("myFace");
const voiceBtn = document.getElementById("voice");
const cameraBtn = document.getElementById("camera");

let myStream;
let voiceOff = false;
let cameraOff = false;

async function getMedia() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
        myFace.srcObject = myStream;
    } catch (err) {
        console.log(err);
    }
}

getMedia();

function handleVoiceClick() {
    if (!voiceOff) {
        voiceOff = true;
        voiceBtn.innerText = "Voice On"
    } else {
        voiceOff = false;
        voiceBtn.innerText = "Voice Off";
    }
}

function handleCameraClick() {
    if (!cameraOff) {
        cameraOff = true;
        cameraBtn.innerText = "Camera On"
    } else {
        cameraOff = false;
        cameraBtn.innerText = "Camera Off";
    }
}

voiceBtn.addEventListener("click", handleVoiceClick);
cameraBtn.addEventListener("click", handleCameraClick);