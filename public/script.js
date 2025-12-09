// Elemente aus HTML
const userAvatar = document.getElementById("user-avatar");
const userDisplayName = document.getElementById("user-display-name");

function showPage(pageName) {
    document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
    document.getElementById(`page-${pageName}`).classList.remove("hidden");

    if (pageName === "members") {
        loadMembers();
    }
}

// STATUS / LOGIN LADEN
document.addEventListener("DOMContentLoaded", () => {
    refreshStatus();
});

async function refreshStatus() {
    try {
        const res = await fetch("/api/me", { credentials: "include" });
        const data = await res.json();

        if (!data.loggedIn) {
            userDisplayName.textContent = "Nicht eingeloggt";
            return;
        }

        // User anzeigen
        userDisplayName.textContent = data.username;
        userAvatar.src = `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png?size=64`;

    } catch (err) {
        console.error("Fehler beim Status laden:", err);
    }
}

// Mitgliederliste laden (Backend muss implementiert sein)
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
