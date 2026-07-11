const SITE = "qc";

import { db } from "./firebase.js";
import {
    ref,
    onValue,
    remove
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const board = document.getElementById("board");
const popup = document.getElementById("popup");

let queue = [];
let processing = false;

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

    for(let r = 1; r <= 5; r++){

        html += "<tr>";

        for(let c = 0; c < 4; c++){

            let seat = r + (c * 5);

            let color = (c % 2 === 0)
                ? "pink"
                : "green";

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

/* QC SEATS */
onValue(
    ref(db, `locations/${SITE}/seats`),
    snapshot => {

        const seats = snapshot.val() || [];

        draw(seats);

    }
);

/* QC QUEUE */
onValue(
    ref(db, `locations/${SITE}/queue`),
    snapshot => {

        const data = snapshot.val() || {};

        queue = Object.entries(data);

    }
);

function femaleVoice(){

    const voices = speechSynthesis.getVoices();

    return (
        voices.find(v =>
            /zira|aria|samantha|jenny/i.test(v.name)
        ) || voices[0]
    );
}

setInterval(async () => {

    if(processing) return;

    if(queue.length === 0) return;

    processing = true;

    const [key,item] = queue[0];

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

    if(isNaN(item.id)){

        announceText =
            `Seat number ${item.seat}. Applicant ${item.id}. Please proceed to Testing Room.`;

    }else{

        announceText =
            `Seat number ${item.seat}. ID number ${item.id}. Please proceed to Testing Room.`;

    }

    const u = new SpeechSynthesisUtterance(
        announceText
    );

    u.voice = femaleVoice();
    u.rate = 0.8;
    u.pitch = 1.0;
    u.volume = 1;

    speechSynthesis.cancel();

    setTimeout(() => {
        speechSynthesis.speak(u);
    }, 300);

    setTimeout(async () => {

        popup.classList.add("hidden");

        try{

            await remove(
                ref(db, `locations/${SITE}/queue/${key}`)
            );

        }catch(err){

            console.log(err);

        }

        processing = false;

    }, 8000);

}, 1000);
