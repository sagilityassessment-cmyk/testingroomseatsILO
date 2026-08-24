const SITE = "ILO";

import { db } from "./firebase.js";
import {
    ref,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const board = document.getElementById("board");
const interviewBoard = document.getElementById("interviewBoard");
const popup = document.getElementById("popup");

const chime = new Audio("./chime.mp3");

let selectedVoice = null;
let queue = [];
let interviewQueue = [];
let processing = false;
let chimePlayed = false;
let currentTestingCall = null;
let testingHistory = [];
let currentInterviewCall = null;
let interviewHistory = [];

let interviewRooms = {
    1: "",
    2: "",
    3: "",
    4: "",
    5: ""
};

/* FEMALE VOICE */

function loadFemaleVoice() {

    const voices = speechSynthesis.getVoices();

    selectedVoice =
        voices.find(v => /jenny/i.test(v.name)) ||
        voices.find(v => /aria/i.test(v.name)) ||
        voices.find(v => /zira/i.test(v.name)) ||
        voices.find(v => /samantha/i.test(v.name)) ||
        voices[0];

    console.log("Using voice:", selectedVoice?.name);
}

loadFemaleVoice();
speechSynthesis.onvoiceschanged = loadFemaleVoice;

/* TESTING ROOM CALL BOARD */

function callMarkup(call, emptyText) {

    if (!call) {
        return `<div class="call-empty">${emptyText}</div>`;
    }

    return `
        <div class="call-location">${call.location}</div>
        <div class="call-value">${call.value}</div>
    `;
}

function boxMarkup(call) {

    if (!call) {
        return `<div class="box-empty">-</div>`;
    }

    return `
        <div class="box-location">${call?.location || "-"}</div>
        <div class="box-value ${isNaN(call.value) ? "box-name" : "box-id"}">
            ${call.value}
        </div>
    `;
}

function drawCallBoard(boardElement, currentCall, history, emptyText, currentLabel, boxCount, listSize) {

    const previousList = listSize > 0
        ? `
        <div class="previous-list-title">PREVIOUS CALLS</div>
        <div class="previous-list">
            ${Array.from({ length: listSize }, (_, index) => `
                <div class="previous-list-row">
                    <span class="previous-number">${index + 1}</span>
                    <span>${history[index]?.value || "-"}</span>
                </div>
            `).join("")}
        </div>
        `
        : "";

    boardElement.innerHTML = `
        <div class="current-call">
            <div class="current-label">${currentLabel}</div>
            ${callMarkup(currentCall, emptyText)}
        </div>
        <div class="call-history">
            ${Array.from({ length: boxCount }, (_, index) => `
                <div class="history-call">
                    ${boxMarkup(history[index])}
                </div>
            `).join("")}
        </div>
        ${previousList}
    `;
}

function draw() {

    drawCallBoard(
        board,
        currentTestingCall,
        testingHistory,
        "WAITING FOR TESTING ROOM CALL",
        "ASSESSMENT QUEUE",
        4,
        0
    );
}

function drawInterviewRooms() {

    drawCallBoard(
        interviewBoard,
        currentInterviewCall,
        interviewHistory,
        "WAITING FOR INTERVIEW ROOM CALL",
        "INTERVIEW QUEUE",
        4,
        0
    );
}

draw();
drawInterviewRooms();

/* TESTING QUEUE */

onValue(
    ref(db, `locations/${SITE}/queue`),
    snapshot => {

        const data = snapshot.val() || {};

        queue = Object.entries(data);

        if (
            queue.length === 0 &&
            interviewQueue.length === 0
        ) {
            chimePlayed = false;
        }
        }
    );

/* INTERVIEW QUEUE */

onValue(
    ref(db, `locations/${SITE}/interviewQueue`),
    snapshot => {

        const data = snapshot.val() || {};

        interviewQueue = Object.entries(data);

        if (
            queue.length === 0 &&
            interviewQueue.length === 0
        ) {
            chimePlayed = false;
        }
        }
    );
/* INTERVIEW ROOMS REALTIME */

onValue(
    ref(db, `locations/${SITE}/interviewRooms`),
    snapshot => {

        const data = snapshot.val() || {};

        interviewRooms = {
            1: data[1] || "",
            2: data[2] || "",
            3: data[3] || "",
            4: data[4] || "",
            5: data[5] || ""
        };

        drawInterviewRooms();

    }
);
/* PROCESS QUEUE */

setInterval(async () => {

    if (processing) return;

    if (
        queue.length === 0 &&
        interviewQueue.length === 0
    ) return;

    processing = true;

    let key;
    let item;
    let isInterview = false;

    if (queue.length > 0) {

        [key, item] = queue[0];

    } else {

        [key, item] = interviewQueue[0];

        isInterview = true;
    }

    if (isInterview) {
        if (currentInterviewCall) {
            interviewHistory.unshift(currentInterviewCall);
            interviewHistory = interviewHistory.slice(0, 5);
        }
        currentInterviewCall = {
            location: `ROOM ${item.room}`,
            value: item.value
        };
        drawInterviewRooms();
    } else {
        if (currentTestingCall) {
            testingHistory.unshift(currentTestingCall);
            testingHistory = testingHistory.slice(0, 8);
        }
        currentTestingCall = {
            location: `SEAT ${item.seat}`,
            value: item.id
        };
        draw();
    }

    popup.classList.remove("hidden");

    let announceText = "";

if (isInterview) {

popup.innerHTML = `
    <div class="seat-call">
        ROOM ${item.room}
    </div>

<div class="${
    isNaN(item.value)
        ? 'applicant-call-name'
        : 'applicant-call-id'
}">
    ${item.value}
</div>

    <div class="instruction">
        PLEASE PROCEED TO INTERVIEW ROOM
    </div>
`;

    if (isNaN(item.value)) {

        announceText =
            `Applicant ${item.value}. Room ${item.room}. Please proceed for your Interview.`;

    } else {

        announceText =
            `Applicant ID ${item.value}. Room ${item.room}. Please proceed for your Interview.`;
    }

} else {

popup.innerHTML = `
    <div class="seat-call">
        SEAT ${item.seat}
    </div>

<div class="${
    isNaN(item.id)
        ? 'applicant-call-name'
        : 'applicant-call-id'
}">
    ${item.id}
</div>

    <div class="instruction">
        PLEASE PROCEED TO TESTING ROOM
    </div>
`;

        if (isNaN(item.id)) {

            announceText =
                `Applicant ${item.id}. Seat number ${item.seat}. Please proceed to Testing Room.`;

        } else {

            announceText =
                `Applicant ID ${item.id}. Seat number ${item.seat}. Please proceed to Testing Room.`;
        }
    }

    const speak = () => {

        speechSynthesis.cancel();

        const speech =
            new SpeechSynthesisUtterance(
                announceText
            );

        speech.voice = selectedVoice;
        speech.rate = 0.9;
        speech.pitch = 1;
        speech.volume = 1;

        speechSynthesis.speak(speech);
    };

    try {

        if (!chimePlayed) {

            chimePlayed = true;

            chime.pause();
            chime.currentTime = 0;

            await chime.play();

            setTimeout(() => {
                speak();
            }, 2000);

        } else {

            speak();
        }

    } catch (err) {

        console.log("Chime failed:", err);

        speak();
    }

    setTimeout(async () => {

        popup.classList.add("hidden");

        try {

            await remove(
                ref(
                    db,
                    isInterview
                        ? `locations/${SITE}/interviewQueue/${key}`
                        : `locations/${SITE}/queue/${key}`
                )
            );

        } catch (err) {

            console.log(err);
        }

        processing = false;

    }, 10000);

}, 2000);
