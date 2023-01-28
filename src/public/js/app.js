const socket = io();

const myFace = document.getElementById("myFace");
const voiceBtn = document.getElementById("voice");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;

let voiceOff = false;
let cameraOff = false;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            camerasSelect.appendChild(option);
        });
    } catch (err) {
        console.log(err);
    };
}

async function getMedia() {
    try {
        myStream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: true
        });
        myFace.srcObject = myStream;
        await getCameras();
    } catch (err) {
        console.log(err);
    };
}

getMedia();

function handleVoiceClick() {
    myStream.getAudioTracks()
    .forEach((track) => track.enabled = !track.enabled);
    if (!voiceOff) {
        voiceOff = true;
        voiceBtn.innerText = "Voice On"
    } else {
        voiceOff = false;
        voiceBtn.innerText = "Voice Off";
    }
}

function handleCameraClick() {
    myStream.getVideoTracks()
    .forEach((track) => track.enabled = !track.enabled);
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