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

const u = new SpeechSynthesisUtterance(
    `Seat number ${item.seat}. I D number ${item.id}. Please proceed to Testing Room.`
);

u.voice = femaleVoice();
u.rate = 0.7;
u.pitch = 1.0;
u.volume = 1;

speechSynthesis.cancel();
speechSynthesis.speak(u);

setTimeout(async ()=>{

    popup.classList.add("hidden");

    await remove(
        ref(db, `queue/${key}`)
    );

    processing = false;

}, 8000);
