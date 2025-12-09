const userAvatar = document.getElementById("user-avatar");
const userDisplayName = document.getElementById("user-display-name");

function showPage(pageName) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(`page-${pageName}`).classList.remove("hidden");

    if (pageName === "members") {
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

// Mitgliederliste laden
async function loadMembers() {
    try {
        const res = await fetch("/api/members", { credentials: "include" });
        const members = await res.json();

        const table = document.getElementById("member-table");
        table.innerHTML = `<tr><th>Avatar</th><th>Name</th><th>ID</th></tr>`;

        members.forEach(m => {
            if (!m.user) return;
            table.innerHTML += `
                <tr>
                    <td><img src="https://cdn.discordapp.com/avatars/${m.user.id}/${m.user.avatar}.png?size=32"></td>
                    <td>${m.user.username}</td>
                    <td>${m.user.id}</td>
                </tr>
            `;
        });

    } catch (err) {
        console.error("Fehler beim Laden der Mitgliederliste:", err);
    }
}
