const socket = io();

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
/** @type {RTCDataChannel} */
let myDataChannel;

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
        if (!deviceId) {
            await getCameras();
        }
    } catch (err) {
        console.log(err);
    };
}

function handleVoiceClick() {
    myStream
    .getAudioTracks()
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
    myStream
    .getVideoTracks()
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
    if (myPeerConnection) {
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
                            .getSenders()
                            .find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

voiceBtn.addEventListener("click", handleVoiceClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

// Chat Form (chat with a message)

const chat = document.getElementById("chat");
const chatForm = chat.querySelector("form")
const messageList = chat.querySelector("ul");

function handleChatReceive(nickName, event) {
    const li = document.createElement("li");
    li.innerText = `${nickName}: ${event.data}`;
    messageList.appendChild(li);
}

function handleChatSend(event) {
    event.preventDefault();
    const input = chat.querySelector("input");
    myDataChannel.send(input.value);
    const li = document.createElement("li");
    li.innerText = `You: ${input.value}`;
    messageList.appendChild(li);
    input.value = "";
}

chatForm.addEventListener("submit", handleChatSend);

// Welcome Form (join a room)

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form")
const call = document.getElementById("call");

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    chat.hidden = false;
    await getMedia();
    makeConnection();
}

function handleWelcomeSubmit(event) {
    event.preventDefault();
    const input = welcome.querySelectorAll("input");
    socket.emit("verifiy", input[0].value, async (message) => {
        if (message === "FULL") {
            alert("This room is full");
        } else {
            await initCall();
            socket.emit("joinRoom", input[0].value, input[1].value);
            roomName = input[0].value;
            nickName = input[1].value;
        }
        input[0].value = "";
        input[1].value = "";
    });
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);

// Socket Code

socket.on("welcome", async (nickName) => {
    console.log(`Hi~ ${nickName}`);
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", (event) => {
        handleChatReceive(nickName, event);
    });
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);
});

socket.on("offer", async (offer, nickName) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", (event) => {
            handleChatReceive(nickName, event);
        });
    });
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    console.log("sent the answer");
    socket.emit("answer", answer, roomName);
});

socket.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    console.log("received the candidate");
    myPeerConnection.addIceCandidate(ice);
});

socket.on("bye", (nickName) => {
    console.log(`Bye~ ${nickName}`);
});

// RTC Code

function makeConnection() {
    myPeerConnection = new RTCPeerConnection();
    myPeerConnection.addEventListener("icecandidate", (data) => {
        console.log("sent the candidate");
        socket.emit("ice", data.candidate, roomName);
    });
    myPeerConnection.addEventListener("addstream", (data) => {
        const peerFace = document.getElementById("peerFace");
        peerFace.srcObject = data.stream;
    });
    myStream
    .getTracks()
    .forEach((track) => myPeerConnection.addTrack(track, myStream));
}