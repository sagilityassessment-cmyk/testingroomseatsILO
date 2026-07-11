setInterval(async () => {

    if (processing) return;

    if (queue.length === 0) {
        chimePlayed = false;
        return;
    }

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

    const speak = () => {

        speechSynthesis.cancel();

        const speech = new SpeechSynthesisUtterance(
            announceText
        );

        speech.voice = selectedVoice;
        speech.rate = 0.9;
        speech.pitch = 1.0;
        speech.volume = 1;

        speechSynthesis.speak(speech);
    };

    try {

        if (!chimePlayed) {

            chimePlayed = true;

            await new Promise((resolve) => {

                chime.pause();
                chime.currentTime = 0;

                chime.onended = () => {
                    resolve();
                };

                chime.play().catch(() => {
                    resolve();
                });

            });

            speak();

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
                ref(db, `locations/${SITE}/queue/${key}`)
            );

        } catch (err) {

            console.log(err);

        }

        processing = false;

    }, 10000);

}, 1000);
