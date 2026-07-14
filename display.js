const SITE = "iloilo";

import { db } from "./firebase.js";
import {
    ref,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const board = document.getElementById("board");
const popup = document.getElementById("popup");

const chime = new Audio("./chime.mp3");

/* Unlock audio after first click */
document.addEventListener("click", () => {
    chime.play()
        .then(() => {
            chime.pause();
            chime.currentTime = 0;
        })
        .catch(() => {});
}, { once: true });

let selectedVoice = null;
let queue = [];
let processing = false;
let chimePlayed = false;

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

            const seat = r + (c * 5);
            const color = (c % 2 === 0) ? "pink" : "green";

            html += `
                <td class="${color}">
                    SEAT ${seat}
                </td>

                <td class="${color}">
                    ${seats[seat] || 0}
                </td>
            `;
        }

        html += "</tr>";
    }

    html += "</table>";

    board.innerHTML = html;
}

onValue(
    ref(db, `locations/${SITE}/seats`),
    snapshot => {

        const seats = snapshot.val() || [];
        draw(seats);

    }
);

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

setInterval(async () => {

    if (processing) return;

    if (queue.length === 0) return;

    processing = true;

    const [key, item] = queue[0];

    popup.classList.remove("hidden");

    popup.innerHTML = `
        <div class="seat-call">
            SEAT ${item.seat} - ID ${item.id}
        </div>

        <div class="instruction">
            PLEASE PROCEED TO TESTING ROOM
        </div>
    `;

    let announceText = "";

    if (isNaN(item.id)) {

        announceText =
            `Seat number ${item.seat}. Applicant ${item.id}. Please proceed to Testing Room.`;

    } else {

        announceText =
            `Seat number ${item.seat}. ID number ${item.id}. Please proceed to Testing Room.`;

    }

    const speech = new SpeechSynthesisUtterance(
        announceText
    );

    speech.voice = selectedVoice;
    speech.rate = 0.9;
    speech.pitch = 1.0;
    speech.volume = 1;

    try {

        if (!chimePlayed) {

            chimePlayed = true;

            chime.pause();
            chime.currentTime = 0;

            await chime.play();

            setTimeout(() => {
                speechSynthesis.speak(speech);
            }, 1000);

        } else {

            speechSynthesis.speak(speech);

        }

    } catch (err) {

        speechSynthesis.speak(speech);

    }

    setTimeout(async () => {

        popup.classList.add("hidden");

        try {

            await remove(
                ref(db, `locations/${SITE}/queue/${key}`)
            );

        } catch (err) {

            console.log(err);

        }

        processing = false;

    }, 10000);

}, 2000);
