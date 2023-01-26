const socket = io();

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

const room = document.getElementById("room");
const nameForm = room.querySelector("#name");
const msgForm = room.querySelector("#msg");

room.hidden = true;

let roomName;

function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = nameForm.querySelector("input");
    socket.emit("nickname", input.value);
}

function handleMessageSubmit(event) {
    event.preventDefault();
    const input = msgForm.querySelector("input");
    const value = input.value;
    socket.emit("newMessage", value, roomName, () => {
        addMessage(`You: ${value}`);
    });
    input.value = "";
}

function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    nameForm.addEventListener("submit", handleNicknameSubmit);
    msgForm.addEventListener("submit", handleMessageSubmit);
}

welcomeForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    socket.emit("enterRoom", input.value, showRoom);
    roomName = input.value;
    input.value = "";
});

function addMessage(message) {
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

socket.on("welcome", (user) => {
    addMessage(`${user} joined!`)
});

socket.on("bye", (user) => {
    addMessage(`${user} left!`)
});

socket.on("newMessage", addMessage);

socket.on("roomChange", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if (rooms.length === 0) {
        return;
    };
    rooms.forEach((room) => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });
});