const SITE = "ILO";

import { db } from "./firebase.js";
import {
    ref,
    set,
    get,
    push
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const g = document.getElementById("grid");
const interviewGrid = document.getElementById("interviewGrid");

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

<textarea
    id="seat${i}"
    onchange="saveSeat(${i}, this.value)"
>${v}</textarea>

            <button
                id="b${i}"
                onclick="callSeat(${i})"
            >
                CALL
            </button>
        </div>
        `;
    }

    if (interviewGrid) {

        interviewGrid.innerHTML = "";

        const roomsSnapshot = await get(
            ref(
                db,
                `locations/${SITE}/interviewRooms`
            )
        );

        const rooms =
            roomsSnapshot.exists()
                ? roomsSnapshot.val()
                : {};

        for (let i = 1; i <= 5; i++) {

            const roomValue = rooms[i] || "";

            interviewGrid.innerHTML += `
            <div class="card">
                <h3>Interview Room ${i}</h3>

<textarea
    id="interviewName${i}"
    placeholder="Applicant ID or Name"
    onchange="saveInterview(${i}, this.value)"
>${roomValue}</textarea>

                <button
                    id="ib${i}"
                    onclick="callInterview(${i})"
                >
                    CALL INTERVIEW
                </button>
            </div>
            `;
        }
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

window.saveInterview = async function(room, value){

    await set(
        ref(
            db,
            `locations/${SITE}/interviewRooms/${room}`
        ),
        value || ""
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
            seat,
            id,
            timestamp: Date.now()
        }
    );

    const btn = document.getElementById(
        "b" + seat
    );

    btn.className = "called";
    btn.innerHTML = "CALLED ✓";

    setTimeout(() => {

        btn.className = "";
        btn.innerHTML = "CALL";

    }, 10000);
};

window.callInterview = async function(room){

    const value = document
        .getElementById(`interviewName${room}`)
        .value
        .trim();

    if (!value) return;

    await push(
        ref(
            db,
            `locations/${SITE}/interviewQueue`
        ),
        {
            room,
            value,
            timestamp: Date.now()
        }
    );

    const btn = document.getElementById(
        `ib${room}`
    );

    btn.className = "called";
    btn.innerHTML = "CALLED ✓";

    setTimeout(() => {

        btn.className = "";
        btn.innerHTML = "CALL INTERVIEW";

    }, 10000);
};

window.clearAllSeats = async function(){

    const confirmClear = confirm(
        "Are you sure you want to clear all seat data?"
    );

    if (!confirmClear) return;

    for (let i = 1; i <= 20; i++) {

        await set(
            ref(
                db,
                `locations/${SITE}/seats/${i}`
            ),
            0
        );
    }

    for (let i = 1; i <= 5; i++) {

        await set(
            ref(
                db,
                `locations/${SITE}/interviewRooms/${i}`
            ),
            ""
        );
    }

    alert(
        "Testing Room and Interview Room have been cleared."
    );

    loadSeats();
};

loadSeats();