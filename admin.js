const SITE = "qc";

import { db } from "./firebase.js";
import {
    ref,
    set,
    get,
    push
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const g = document.getElementById("grid");

async function loadSeats() {

    const snapshot = await get(
        ref(db, `locations/${SITE}/seats`)
    );

    let seats = {};

    if (snapshot.exists()) {
        seats = snapshot.val();
    }

    g.innerHTML = "";

    for (let i = 1; i <= 20; i++) {

        let v = seats[i] || 0;

        g.innerHTML += `
        <div class="card">
            <h3>Seat ${i}</h3>

            <input
                id="seat${i}"
                value="${v}"
                onchange="saveSeat(${i}, this.value)"
            >

            <button
                id="b${i}"
                onclick="callSeat(${i})"
            >
                CALL
            </button>
        </div>
        `;
    }
}

window.saveSeat = async function(seat, value){

    await set(
        ref(
            db,
            `locations/${SITE}/seats/${seat}`
        ),
        value || 0
    );

};

window.callSeat = async function(seat){

    const seatSnapshot = await get(
        ref(
            db,
            `locations/${SITE}/seats/${seat}`
        )
    );

    let id = 0;

    if (seatSnapshot.exists()) {
        id = seatSnapshot.val();
    }

    await push(
        ref(
            db,
            `locations/${SITE}/queue`
        ),
        {
            seat: seat,
            id: id,
            timestamp: Date.now()
        }
    );

    const btn = document.getElementById(
        "b" + seat
    );

    btn.className = "called";
    btn.innerHTML = "CALLED ✓";
};

window.clearAllSeats = async function () {

    const confirmClear = confirm(
        "Are you sure you want to clear all seat data?"
    );

    if (!confirmClear) {
        return;
    }

    for (let i = 1; i <= 20; i++) {

        await set(
            ref(
                db,
                `locations/${SITE}/seats/${i}`
            ),
            0
        );

    }

    alert("All seats have been reset to 0.");

    loadSeats();
};
loadSeats();
