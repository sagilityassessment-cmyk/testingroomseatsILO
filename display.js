const SITE = "test";

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

/* TESTING ROOM TABLE */

function draw(seats = []) {

    let html = `
    <table>
        <tr>
            <th>SEAT</th><th>ID NO.</th>
            <th>SEAT</th><th>ID NO.</th>
            <th>SEAT</th><th>ID NO.</th>
            <th>SEAT</th><th>ID NO.</th>
        </tr>
    `;

    for (let r = 1; r <= 5; r++) {

        html += "<tr>";

        for (let c = 0; c < 4; c++) {

            let seat = r + (c * 5);

            let color =
                (c % 2 === 0)
                ? "pink"
                : "green";

html += `
    <td class="${color}">
        SEAT ${seat}
    </td>

    <td class="${color}">
        <span class="${
            seats[seat] &&
            isNaN(seats[seat])
                ? "name-value"
                : "id-value"
        }">
            ${seats[seat] || 0}
        </span>
    </td>
`;
        }

        html += "</tr>";
    }

    html += "</table>";

    board.innerHTML = html;
}

/* INTERVIEW ROOM TABLE */

function drawInterviewRooms() {

    let html = `
    <table>
        <tr>
            <th>ROOM 1</th>
            <th>ROOM 2</th>
            <th>ROOM 3</th>
            <th>ROOM 4</th>
            <th>ROOM 5</th>
        </tr>

       <tr>

    <td class="pink">
        <span class="${
            interviewRooms[1] &&
            isNaN(interviewRooms[1])
                ? "name-value"
                : "id-value"
        }">
            ${interviewRooms[1] || "0"}
        </span>
    </td>

    <td class="green">
        <span class="${
            interviewRooms[2] &&
            isNaN(interviewRooms[2])
                ? "name-value"
                : "id-value"
        }">
            ${interviewRooms[2] || "0"}
        </span>
    </td>

    <td class="pink">
        <span class="${
            interviewRooms[3] &&
            isNaN(interviewRooms[3])
                ? "name-value"
                : "id-value"
        }">
            ${interviewRooms[3] || "0"}
        </span>
    </td>

    <td class="green">
        <span class="${
            interviewRooms[4] &&
            isNaN(interviewRooms[4])
                ? "name-value"
                : "id-value"
        }">
            ${interviewRooms[4] || "0"}
        </span>
    </td>

    <td class="pink">
        <span class="${
            interviewRooms[5] &&
            isNaN(interviewRooms[5])
                ? "name-value"
                : "id-value"
        }">
            ${interviewRooms[5] || "0"}
        </span>
    </td>

</tr>
    </table>
    `;

    interviewBoard.innerHTML = html;
}

drawInterviewRooms();

/* SEATS */

onValue(
    ref(db, `locations/${SITE}/seats`),
    snapshot => {

        const seats = snapshot.val() || [];

        draw(seats);
    }
);

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