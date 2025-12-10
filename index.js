import express from "express";
import session from "express-session";
import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load .env variables
dotenv.config();

// Discord OAuth Settings
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;
const GUILD_ID = process.env.GUILD_ID;

// Express setup
const app = express();
app.use(express.json());

// Render verwendet einen Proxy → Sessions funktionieren sonst nicht
app.set("trust proxy", 1);

const enhanced = members.map(m => ({
    id: m.user?.id || "unknown",
    username: m.user?.username || "Unbekannt",
    avatar: m.user?.avatar || null,
    nickname: m.nick || null,
    roles: m.roles?.map(rid => roleMap[rid] || rid) || []
}));

// ⭐ KORREKTE SESSION CONFIG — nur diese, NICHT doppelt!
app.use(
  session({
    secret: "supersecret-key-hier-aendern",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,       // Cookie NUR über HTTPS
      httpOnly: true,     // Nicht über JS auslesbar
      sameSite: "none",   // Wichtig: Cross-Site Cookies
      maxAge: 1000 * 60 * 60 * 24 // 1 Tag gültig
    }
  })
);

// Render static files from /public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

// ➤ Homepage
app.get("/", (req, res) => {
  return res.sendFile(path.join(__dirname, "public/index.html"));
});

// ➤ Discord Login
app.get("/auth/discord", (req, res) => {
  const url =
    `https://discord.com/oauth2/authorize?` +
    `client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code` +
    `&scope=identify%20guilds`;

  
  return res.redirect(url);
});

// ➤ Discord Callback
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Fehler: Kein Code erhalten.");

  const tokenData = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
  });

  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: tokenData,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const tokenJSON = await tokenResponse.json();
  req.session.access_token = tokenJSON.access_token;

  console.log("ACCESS TOKEN gesetzt:", tokenJSON.access_token);

  return res.redirect("/");
});

function loadMembers() {
    fetch("/api/members")
        .then(res => res.json())
        .then(members => {
            const table = document.getElementById("member-table");

            // zuerst alte Zeilen entfernen (außer Header)
            table.querySelectorAll("tr:not(:first-child)").forEach(e => e.remove());

            members.forEach(m => {
                const avatarURL = m.avatar
                    ? `https://cdn.discordapp.com/avatars/${m.id}/${m.avatar}.png?size=64`
                    : `https://cdn.discordapp.com/embed/avatars/0.png`;

                const row = document.createElement("tr");

                row.innerHTML = `
                    <td><img src="${avatarURL}" width="48" height="48" style="border-radius:50%"></td>
                    <td>${m.username}</td>
                    <td>${m.nickname || "-"}</td>
                    <td>${m.roles.join(", ")}</td>
                `;

                table.appendChild(row);
            });
        })
        .catch(err => console.error("Fehler beim Laden der Members:", err));
}



// ➤ /api/me — Userdaten
app.get("/api/me", async (req, res) => {
  console.log("SESSION TOKEN =", req.session.access_token);
  console.log("GUILD_ID =", GUILD_ID);

  if (!req.session.access_token) {
    console.log("❌ KEIN ACCESS TOKEN — nicht eingeloggt!");
    return res.json({ loggedIn: false });
  }

  // User abrufen
  const userReq = await fetch("https://discord.com/api/users/@me", {
    headers: { Authorization: `Bearer ${req.session.access_token}` }
  });
  const user = await userReq.json();
  console.log("USER INFO =", user);

  // Guilds abrufen
  const guildReq = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${req.session.access_token}` }
  });
  const guilds = await guildReq.json();
  console.log("GUILDS =", guilds);

  const inGuild = guilds.some(g => g.id === GUILD_ID);
  console.log("IN GUILD =", inGuild);

  return res.json({
    loggedIn: true,
    id: user.id,
    username: `${user.username}#${user.discriminator}`,
    avatar: user.avatar,
    inGuild,
    guildName: "Reckless"
  });
});

app.get("/api/members", async (req, res) => {
    try {
        // 1) GUILD abrufen (für Rollen)
        const guildReq = await fetch(
            `https://discord.com/api/v10/guilds/${GUILD_ID}`,
            {
                headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
            }
        );
        const guild = await guildReq.json();

        // Dictionary: roleId → roleName
        const roleMap = {};
        guild.roles.forEach(role => {
            roleMap[role.id] = role.name;
        });

        // 2) Mitglieder abrufen
        const membersReq = await fetch(
            `https://discord.com/api/v10/guilds/${GUILD_ID}/members?limit=1000`,
            {
                headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` }
            }
        );
        const members = await membersReq.json();

        // 3) Mitglieder erweitern (nickname, roles → names)
        const enhanced = members.map(m => ({
            id: m.user.id,
            username: m.user.username,
            avatar: m.user.avatar,
            nickname: m.nick || null,
            roles: m.roles.map(rid => roleMap[rid] || rid) // Rolle in Namen umwandeln
        }));

        return res.json(enhanced);

    } catch (err) {
        console.error("Fehler beim Abrufen der Mitgliederliste:", err);
        return res.status(500).json({ error: "Fehler beim Abrufen der Liste" });
    }
});




// ➤ Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
