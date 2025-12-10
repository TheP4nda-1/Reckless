const userAvatar = document.getElementById("user-avatar");
const userDisplayName = document.getElementById("user-display-name");

function showPage(page) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById("page-" + page).classList.remove("hidden");

    if (page === "members") {
        loadMembers();
    }
}


// AUTOMATISCHER LOGIN BEI SEITENAUFRUF
document.addEventListener("DOMContentLoaded", async () => {
    const res = await fetch("/api/me", { credentials: "include" });
    const data = await res.json();

    if (!data.loggedIn) {
        // Wenn NICHT eingeloggt → sofort zu Discord Login
        window.location.href = "/auth/discord";
        return;
    }

    // Wenn eingeloggt → Dashboard anzeigen
    userDisplayName.textContent = data.username;
    userAvatar.src = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=64`;
});

async function loadMembers() {
    try {
        const res = await fetch("/api/members");
        const members = await res.json();

        const table = document.getElementById("member-table");

        // Header stehen lassen
        table.innerHTML = `
            <tr>
                <th>Avatar</th>
                <th>Name</th>
                <th>Nickname</th>
                <th>Rollen</th>
            </tr>
        `;

        members.forEach(m => {

            const avatarURL = m.avatar
                ? `https://cdn.discordapp.com/avatars/${m.id}/${m.avatar}.png?size=64`
                : "https://cdn.discordapp.com/embed/avatars/0.png";

            const row = document.createElement("tr");

            row.innerHTML = `
                <td><img src="${avatarURL}" width="40" style="border-radius:50%"></td>
                <td>${m.username}</td>
                <td>${m.nickname || "-"}</td>
                <td>${m.roles.length > 0 ? m.roles.join(", ") : "-"}</td>
            `;

            table.appendChild(row);
        });

    } catch (err) {
        console.error("Fehler beim Laden der Mitgliederliste:", err);
    }
}



