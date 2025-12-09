// Erwartetes Backend-API-Format für GET /api/me:
//
// {
//   "loggedIn": true/false,
//   "username": "Name#1234" oder null,
//   "inGuild": true/false,
//   "guildName": "Reckless"
// }
//
// Passe das ggf. an dein Backend an.

const statusTextEl = document.getElementById("status-text");
const statusBoxEl = document.getElementById("status-box");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfoBox = document.getElementById("user-info");
const userNameEl = document.getElementById("user-name");
const guildStatusEl = document.getElementById("guild-status");

// Beim Laden der Seite Status prüfen
document.addEventListener("DOMContentLoaded", () => {
    refreshStatus();
});

// Login-Button leitet auf deinen OAuth2-Endpoint weiter
loginBtn.addEventListener("click", () => {
    // Dieser Endpoint muss im Backend existieren und den Discord OAuth2 Flow starten
    window.location.href = "/auth/discord";
});

// Logout-Button (optional) – abhängig davon, ob du Sessions verwendest
logoutBtn.addEventListener("click", async () => {
    try {
        await fetch("/api/logout", { method: "POST" });
    } catch (e) {
        console.error("Logout-Fehler:", e);
    }
    await refreshStatus();
});

async function refreshStatus() {
    setStatus("Lade Status…", null);
    userInfoBox.classList.add("hidden");
    logoutBtn.classList.add("hidden");

    try {
        const res = await fetch("/api/me", { credentials: "include" });
        if (!res.ok) {
            throw new Error("Antwort vom Server war nicht OK");
        }

        const data = await res.json();

        if (!data.loggedIn) {
            // Nicht eingeloggt
            setStatus("Du bist nicht eingeloggt. Bitte nutze „Mit Discord einloggen“.", "warn");
            return;
        }

        // Eingeloggt → User-Infos anzeigen
        userInfoBox.classList.remove("hidden");
        logoutBtn.classList.remove("hidden");

        userNameEl.textContent = data.username || "Unbekannt";

        if (data.inGuild) {
            setStatus(
                `Eingeloggt als ${data.username}. Du bist Mitglied von ${data.guildName || "dem erforderlichen Server"}. ✅`,
                "ok"
            );
            guildStatusEl.textContent = "Ja ✅";
        } else {
            setStatus(
                `Eingeloggt als ${data.username}, aber du bist nicht auf dem benötigten Discord Server. ❌`,
                "error"
            );
            guildStatusEl.textContent = "Nein ❌";
        }

    } catch (err) {
        console.error(err);
        setStatus("Fehler beim Laden des Status. Versuche es später erneut.", "error");
    }
}

function setStatus(text, type) {
    statusTextEl.textContent = text;

    statusBoxEl.classList.remove("status-ok", "status-warn", "status-error");

    if (type === "ok") statusBoxEl.classList.add("status-ok");
    if (type === "warn") statusBoxEl.classList.add("status-warn");
    if (type === "error") statusBoxEl.classList.add("status-error");
}


