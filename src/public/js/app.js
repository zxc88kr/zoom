const socket = io();

const call = document.getElementById("call");

call.hidden = true;

const myFace = document.getElementById("myFace");
const voiceBtn = document.getElementById("voice");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");

let myStream;
let voiceOff = false;
let cameraOff = false;
let roomName;

/** @type {RTCPeerConnection} */
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

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcome.querySelector("input");
    await initCall();
    socket.emit("joinRoom", input.value);
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

socket.on("welcome", async () => {
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer) => {
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    console.log("sent the answer");
    socket.emit("answer", answer, roomName);
});

socket.on("answer", async (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

// RTC Code

function makeConnection() {
    myPeerConnection = new RTCPeerConnection();
    myStream.getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}