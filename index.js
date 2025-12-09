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

import session from "express-session";

// Render verwendet einen Proxy → Sessions funktionieren sonst nicht
app.set("trust proxy", 1);

app.use(
  session({
    secret: "supersecret-key-hier-aendern",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,       // Cookie NUR über HTTPS
      httpOnly: true,     // Nicht über JS auslesbar
      sameSite: "none",   // Wichtig: erlaubt Cross-Site Cookies
      maxAge: 1000 * 60 * 60 * 24 // 1 Tag gültig
    }
  })
);


// Render static files from /public folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

// Session setup
app.use(
  session({
    secret: "supersecret-key-hier-aendern",
    resave: false,
    saveUninitialized: false,
  })
);

// ➤ Route: Homepage (Lädt public/index.html)
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
});

// ➤ Route: Start Discord Login
app.get("/auth/discord", (req, res) => {
  const url = 
    `https://discord.com/api/oauth2/authorize?client_id=${CLIENT_ID}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&response_type=code&scope=identify%20guilds`;

  return res.redirect(url);
});

// ➤ Route: Discord Callback
app.get("/callback", async (req, res) => {
  const code = req.query.code;
  if (!code) return res.send("Fehler: Kein Code erhalten.");

  const tokenData = new URLSearchParams({
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
    grant_type: "authorization_code",
    code: code,
    redirect_uri: REDIRECT_URI,
  });

  const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    body: tokenData,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  const tokenJSON = await tokenResponse.json();
  req.session.access_token = tokenJSON.access_token;

  // Weiter zur Webseite
  return res.redirect("/");
});

// ➤ Route: API -> User Status
app.get("/api/me", async (req, res) => {

    console.log("SESSION TOKEN =", req.session.access_token);
    console.log("GUILD_ID =", process.env.GUILD_ID);

    if (!req.session.access_token) {
        console.log("⚠️ KEIN ACCESS TOKEN — nicht eingeloggt!");
        return res.json({ loggedIn: false });
    }

    // User abfragen
    const userReq = await fetch("https://discord.com/api/users/@me", {
        headers: { Authorization: `Bearer ${req.session.access_token}` }
    });

    const user = await userReq.json();
    console.log("USER INFO =", user);

    // Guilds abfragen
    const guildReq = await fetch("https://discord.com/api/users/@me/guilds", {
        headers: { Authorization: `Bearer ${req.session.access_token}` }
    });

    const guilds = await guildReq.json();
    console.log("GUILDS =", guilds);

    // Prüfen ob User auf deinem Server ist
    const inGuild = guilds.some(g => g.id === process.env.GUILD_ID);
    console.log("IN GUILD =", inGuild);

    return res.json({
        loggedIn: true,
        username: `${user.username}#${user.discriminator}`,
        inGuild,
        guildName: "Reckless"
    });
});




// ➤ Start server (Render dynamic port)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
