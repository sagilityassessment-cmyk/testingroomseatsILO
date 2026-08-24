const SITE = "sample";

import { db } from "./firebase.js";
import {
    ref,
    set,
    get,
    push,
    onValue
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const g = document.getElementById("grid");
const interviewGrid = document.getElementById("interviewGrid");

function watchCompletedCalls(path) {

    const observedKeys = new Set();

    onValue(
        ref(db, path),
        snapshot => {

            const calls = snapshot.val() || {};
            const previouslyObserved = new Set(observedKeys);

            Object.keys(calls).forEach(key => {
                observedKeys.add(key);
            });

            document
                .querySelectorAll("button[data-call-key]")
                .forEach(btn => {

                    const key = btn.dataset.callKey;

                    if (btn.dataset.callPath !== path) return;
                    if (calls[key]) return;
                    if (!previouslyObserved.has(key)) return;

                    delete btn.dataset.callKey;
                    btn.classList.add("fading");

                    setTimeout(() => {
                        btn.className = "";
                        btn.innerHTML = btn.dataset.resetText;
                    }, 1000);
                });
        }
    );
}

watchCompletedCalls(`locations/${SITE}/queue`);
watchCompletedCalls(`locations/${SITE}/interviewQueue`);

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

            const roomValue = rooms[i] || 0;

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
if (id === 0 || id === "") return;
    const callRef = push(
        ref(
            db,
            `locations/${SITE}/queue`
        )
    );

    await set(
        callRef,
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
    btn.dataset.callKey = callRef.key;
    btn.dataset.callPath = `locations/${SITE}/queue`;
    btn.dataset.resetText = "CALL";
};

window.callInterview = async function(room){

    const value = document
        .getElementById(`interviewName${room}`)
        .value
        .trim();

    if (!value || value === 0) return;

    const callRef = push(
        ref(
            db,
            `locations/${SITE}/interviewQueue`
        )
    );

    await set(
        callRef,
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
    btn.dataset.callKey = callRef.key;
    btn.dataset.callPath = `locations/${SITE}/interviewQueue`;
    btn.dataset.resetText = "CALL INTERVIEW";
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
            0
        );
    }

    alert(
        "Testing Room and Interview Room have been cleared."
    );

    loadSeats();
};

loadSeats();