const SITE = "ILO";

import { db } from "./firebase.js";
import {
    ref,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const board = document.getElementById("board");
const popup = document.getElementById("popup");

const chime = new Audio("./chime.mp3");

let selectedVoice = null;
let queue = [];
let processing = false;
let chimePlayed = false;
let currentTestingCall = null;
let testingHistory = [];

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

function showPopupCall({ location, value, instruction, isName = false }) {

    popup.classList.remove("hidden");

    popup.innerHTML = `
        <div class="seat-call">${location}</div>
        <div class="${isName ? "applicant-call-name" : "applicant-call-id"}">${value}</div>
        <div class="instruction">${instruction}</div>
    `;
}

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
        12,
        0
    );
}

draw();

/* TESTING QUEUE */

onValue(
    ref(db, `locations/${SITE}/queue`),
    snapshot => {

        const data = snapshot.val() || {};

        queue = Object.entries(data);

        if (queue.length === 0) {
            chimePlayed = false;
        }
    }
);

onValue(
    ref(db, `locations/${SITE}/interviewQueue`),
    snapshot => {

        const data = snapshot.val() || {};
        const entries = Object.entries(data);

        if (entries.length === 0) return;

        const [key, item] = entries[0];
        const isName = isNaN(item.value);

        showPopupCall({
            location: `Interviews Room ${item.room}`,
            value: item.value,
            instruction: "PLEASE PROCEED TO INTERVIEW ROOM",
            isName
        });

        const announceText = isName
            ? `Applicant ${item.value}. Interview room ${item.room}. Please proceed to interview room.`
            : `Applicant ID ${item.value}. Interview room ${item.room}. Please proceed to interview room.`;

        const speak = () => {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(announceText);
            utterance.voice = selectedVoice;
            utterance.rate = 0.9;
            utterance.pitch = 1;
            utterance.volume = 1;
            speechSynthesis.speak(utterance);
        };

        speak();

        setTimeout(async () => {
            popup.classList.add("hidden");
            try {
                await remove(
                    ref(db, `locations/${SITE}/interviewQueue/${key}`)
                );
            } catch (err) {
                console.log(err);
            }
        }, 10000);
    }
);

/* PROCESS QUEUE */

setInterval(async () => {

    if (processing) return;
    if (queue.length === 0) return;

    processing = true;

    const [key, item] = queue[0];

    if (currentTestingCall) {
        testingHistory.unshift(currentTestingCall);
        testingHistory = testingHistory.slice(0, 12);
    }

    currentTestingCall = {
        location: `SEAT ${item.seat}`,
        value: item.id
    };
    draw();

    popup.classList.remove("hidden");

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

    const announceText = isNaN(item.id)
        ? `Applicant ${item.id}. Seat number ${item.seat}. Please proceed to Testing Room.`
        : `Applicant ID ${item.id}. Seat number ${item.seat}. Please proceed to Testing Room.`;

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
                    `locations/${SITE}/queue/${key}`
                )
            );

        } catch (err) {

            console.log(err);
        }

        processing = false;

    }, 10000);

}, 2000);
