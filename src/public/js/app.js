const socket = io();

const myFace = document.getElementById("myFace");
const voiceBtn = document.getElementById("voice");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

const call = document.getElementById("call");

call.hidden = true;

let myStream;
let voiceOff = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if (currentCamera.label === camera.label) {
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    } catch (err) {
        console.log(err);
    };
}

async function getMedia(deviceId) {
    const initialConstrains = {
        audio: true,
        video: {facingMode: "user"}
    }
    const cameraConstrains = {
        audio: true,
        video: {deviceId: {exact: deviceId}}
    }
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream;
        if (!deviceId) await getCameras();
    } catch (err) {
        console.log(err);
    };
}

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

async function handleCameraChange() {
    await getMedia(camerasSelect.value);
}

voiceBtn.addEventListener("click", handleVoiceClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome Form (join a room)

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form")

async function startMedia() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcome.querySelector("input");
    socket.emit("joinRoom", input.value, startMedia);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    socket.emit("offer", offer, roomName);
});

socket.on("offer", (offer) => {
    console.log(offer);
});

// RTC Code

function makeConnection() {
    myPeerConnection = new RTCPeerConnection();
    myStream.getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}