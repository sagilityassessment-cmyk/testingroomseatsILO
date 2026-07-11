import { db } from "./firebase.js";
import { ref, onValue } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-database.js";

const board = document.getElementById("board");

onValue(ref(db, "seats"), (snapshot) => {

    const seats = snapshot.val() || [];

    let html = `
    <table style="width:100%;height:100%;border-collapse:collapse;">
    <tr>
        <th>SEAT</th><th>ID NO.</th>
        <th>SEAT</th><th>ID NO.</th>
        <th>SEAT</th><th>ID NO.</th>
        <th>SEAT</th><th>ID NO.</th>
    </tr>
    `;

    for(let r=1;r<=5;r++){

        html += "<tr>";

        for(let c=0;c<4;c++){

            let seat = r + (c*5);

            html += `
            <td>SEAT ${seat}</td>
            <td>${seats[seat] || 0}</td>
            `;
        }

        html += "</tr>";
    }

    html += "</table>";

    board.innerHTML = html;

});
