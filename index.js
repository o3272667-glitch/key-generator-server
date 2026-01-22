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

// Kulcs tároló (memóriában – teszteléshez)
let codes = {}; // később fájlba/DB-be

// Főoldal (egyszerű Redeem Key)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Redeem Key</title>
      <style>
        body { margin:0; background:#0f0f1a; color:white; font-family:Arial; text-align:center; min-height:100vh; display:flex; align-items:center; justify-content:center; }
        .container { background:rgba(30,30,46,0.9); padding:40px; border-radius:20px; max-width:400px; }
        h1 { color:#ff69b4; }
        input { padding:15px; font-size:1.3em; width:80%; margin:15px 0; border-radius:10px; background:#222; color:white; border:1px solid #555; }
        button { padding:15px 40px; font-size:1.3em; background:#00ff9d; color:black; border:none; border-radius:50px; cursor:pointer; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Redeem Key</h1>
        <p>Paste your key to unlock!</p>
        <form action="/redeem" method="POST">
          <input type="text" name="code" placeholder="Your key..." required maxlength="8">
          <button type="submit">Redeem</button>
        </form>
      </div>
    </body>
    </html>
  `);
});

// Generate placeholder (később BitLabs)
app.get('/generate', (req, res) => {
  res.send('<h1>Generating... (BitLabs coming soon)</h1>');
});

// Redeem – itt ad rangot!
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
      console.log(`Added role to ${userId}`);

      setTimeout(async () => {
        await member.roles.remove(role).catch(e => console.log('Remove error:', e));
        console.log(`Removed role from ${userId}`);
      }, 3600 * 1000);

      res.send('<h1 style="color:#00ff9d;padding:100px;text-align:center;">Success! Role added for 1 hour 🎉</h1>');
    } catch (err) {
      console.log('Discord error:', err);
      res.send('<h1 style="color:#ff4444;padding:100px;text-align:center;">Error – contact admin</h1>');
    }
  } else {
    res.send('<h1 style="color:#ff4444;padding:100px;text-align:center;">Invalid or expired key</h1>');
  }
});

// Bot indítása
discordClient.login(process.env.DISCORD_TOKEN).catch(err => console.log('Bot login error:', err));

app.listen(port, '0.0.0.0', () => {
  console.log(`Server & Bot running`);
});
