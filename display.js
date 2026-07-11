import { db } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const board = document.getElementById("board");

function draw(seats = []) {

    let h = "<table><tr>";

    for(let i=0;i<4;i++){
        h += "<th>SEAT</th><th>ID NO.</th>";
    }

    h += "</tr>";

    for(let r=1;r<=5;r++){

        h += "<tr>";

        for(let c=0;c<4;c++){

            let s = r + (c*5);
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

onValue(ref(db,"seats"), snapshot => {

    const seats = snapshot.val() || [];

    console.log("SEATS RECEIVED", seats);

    draw(seats);

});
