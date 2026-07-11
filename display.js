import { db } from "./firebase.js";
import {
  ref,
  onValue,
  remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const board = document.getElementById("board");
const popup = document.getElementById("popup");

console.log("DISPLAY STARTED");

let processing = false;
let queue = [];
let announced = new Set();

function draw(seats = {}) {

    let h = "<table><tr>";

    for (let i = 0; i < 4; i++) {
        h += "<th>SEAT</th><th>ID NO.</th>";
    }

    h += "</tr>";

    for (let r = 1; r <= 5; r++) {

        h += "<tr>";

        for (let c = 0; c < 4; c++) {

            let s = r + (c * 5);
            let cl = c % 2 === 0 ? "pink" : "green";

            h += `
                <td class="${cl}">SEAT ${s}</td>
                <td class="${cl}">${seats[s] || 0}</td>
            `;
        }

        h += "</tr>";
    }

    h += "</table>";

    board.innerHTML = h;
}

draw({});

// LIVE SEAT UPDATES
onValue(
    ref(db, "seats"),
    (snapshot) => {

        const seats = snapshot.val() || {};

        console.log("SEATS:", seats);

        draw(seats);
    },
    (error) => {

        console.error("SEATS ERROR:", error);
    }
);

// LIVE QUEUE
onValue(
    ref(db, "queue"),
    (snapshot) => {

        const data = snapshot.val() || {};

        queue = Object.entries(data).map(
            ([key, value]) => ({
                key,
                ...value
            })
        );

        console.log("QUEUE:", queue);
    },
    (error) => {

        console.error("QUEUE ERROR:", error);
    }
);

function getFemaleVoice() {

    const voices = speechSynthesis.getVoices();

    return (
        voices.find(v =>
            /zira|aria|samantha|jenny/i.test(v.name)
