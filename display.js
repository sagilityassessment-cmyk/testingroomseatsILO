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
    <table style="width:100%;height:100%;border-collapse:collapse;">
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

            html += `
            <td>SEAT ${seat}</td>
            <td>${seats[seat] || 0}</td>
            `;
        }

        html += "</tr>";
    }

    html += "</table>";

    board.innerHTML = html;
}

// Live Seat Sync
onValue(ref(db, "seats"), snapshot => {

    const seats = snapshot.val() || [];

    draw(seats);

});

// Live Queue Sync
onValue(ref(db, "queue"), snapshot => {

    const data = snapshot.val() || {};

    queue = Object.entries(data);

});

// Female Voice
function femaleVoice(){

    const voices = speechSynthesis.getVoices();

    return (
        voices.find(v =>
            /zira|aria|samantha|jenny/i.test(v.name)
        ) || voices[0]
    );
}

// Queue Processor
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

    const u = new SpeechSynthesisUtterance(
        `Seat number ${item.seat}. I Dee number ${item.id}. Please proceed to Testing Room.`
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
                ref(db, `queue/${key}`)
            );
        }catch(err){
            console.log(err);
        }

        processing = false;

    }, 8000);

}, 1000);
