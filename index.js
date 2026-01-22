const express = require('express');
const { Client, GatewayIntentBits } = require('discord.js');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

// Discord bot
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

discordClient.once('ready', () => {
  console.log(`Bot logged in as ${discordClient.user.tag}`);
});

// Teszt kulcsok (cseréld a saját Discord ID-dre teszteléshez)
let codes = {
  '123456789012345678': { code: 'TEST123', expires: Date.now() + 3600 * 1000 } // teszt
};

// Főoldal – GIF háttér + szép dizájn
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redeem Key – Unlock Now</title>
      <style>
        body {
          margin: 0;
          font-family: Arial, sans-serif;
          background: url('https://media.giphy.com/media/3ov9k1173PdfJWRsoE/giphy.gif') no-repeat center center fixed;
          background-size: cover;
          background-attachment: fixed;
          color: white;
          text-align: center;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.78);
          z-index: 1;
        }
        .container {
          position: relative;
          z-index: 2;
          max-width: 480px;
          background: rgba(30, 30, 46, 0.92);
          padding: 40px 25px;
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(255, 105, 180, 0.35);
          backdrop-filter: blur(10px);
        }
        h1 { color: #ff69b4; margin: 0 0 10px; font-size: 2.8em; }
        p { font-size: 1.2em; margin: 10px 0; }
        .btn {
          display: block;
          margin: 25px auto;
          padding: 18px 60px;
          font-size: 1.5em;
          font-weight: bold;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s;
        }
        .generate { background: linear-gradient(135deg, #ff69b4, #ff1493); color: white; }
        .redeem { background: linear-gradient(135deg, #00ff9d, #00bfff); color: black; }
        .btn:hover { transform: scale(1.08); box-shadow: 0 0 25px rgba(255,105,180,0.7); }
        input {
          padding: 16px;
          font-size: 1.4em;
          width: 85%;
          margin: 15px 0;
          border-radius: 12px;
          border: 2px solid #555;
          background: #222;
          color: white;
          text-align: center;
        }
      </style>
    </head>
    <body>
      <div class="overlay"></div>
      <div class="container">
        <h1>Redeem Key</h1>
        <p>Get Your FREE Content Now!</p>

        <h2>Generate Your Key</h2>
        <p>Click below to start and get your unique key!</p>
        <a href="/generate" class="btn generate">Generate Key</a>

        <h2>Redeem Your Key</h2>
        <form action="/redeem" method="POST">
          <input type="text" name="code" placeholder="Paste your key here..." required maxlength="8">
          <button type="submit" class="btn redeem">Redeem Key</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Generate – később BitLabs
app.get('/generate', (req, res) => {
  res.send('<h1 style="text-align:center;padding:150px;background:#0f0f1a;color:#ff69b4;">Generating... (BitLabs soon)</h1>');
});

// Redeem – rang adás
app.post('/redeem', async (req, res) => {
  const code = (req.body.code || '').trim().toUpperCase();
  let valid = false;
  let userId = null;

  for (const uid in codes) {
    if (codes[uid].code === code && Date.now() < codes[uid].expires) {
      valid = true;
      userId = uid;
      delete codes[uid];
      break;
    }
  }

  if (valid && userId) {
    try {
      const guild = discordClient.guilds.cache.get(process.env.GUILD_ID);
      const member = await guild.members.fetch(userId);
      const role = guild.roles.cache.get(process.env.ROLE_ID);

      await member.roles.add(role);
      console.log(`Role added to ${userId}`);

      setTimeout(async () => {
        await member.roles.remove(role).catch(e => console.log('Remove error:', e));
      }, 3600 * 1000);

      res.send('<h1 style="color:#00ff9d;text-align:center;padding:150px;">Success! Role added for 1 hour 🎉</h1>');
    } catch (err) {
      console.log('Error:', err.message);
      res.send('<h1 style="color:red;text-align:center;padding:150px;">Error: ' + err.message + '</h1>');
    }
  } else {
    res.send('<h1 style="color:red;text-align:center;padding:150px;">Invalid or expired key</h1>');
  }
});

// Bot login
discordClient.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('Bot login failed:', err);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
