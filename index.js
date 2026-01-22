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

// Teszt kulcsok – később BitLabs fog generálni
let codes = {
  '123456789012345678': { code: 'TEST123', expires: Date.now() + 3600 * 1000 } // cseréld a saját Discord ID-dre teszteléshez
};

// Egyszerű oldal
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Redeem Key</title>
      <style>
        body { margin:0; background:#111; color:white; font-family:Arial; text-align:center; padding:50px; }
        h1 { color:#0f0; }
        form { margin:30px; }
        input { padding:12px; font-size:1.2em; width:200px; }
        button { padding:12px 30px; font-size:1.2em; background:#0f0; color:black; border:none; cursor:pointer; }
      </style>
    </head>
    <body>
      <h1>Redeem Key</h1>
      <p>Paste your key:</p>
      <form action="/redeem" method="POST">
        <input type="text" name="code" placeholder="Your key..." required>
        <button type="submit">Redeem</button>
      </form>
    </body>
    </html>
  `);
});

// Redeem – itt történik a rang adás
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
      if (!guild) return res.send('<h1>Error: Guild not found</h1>');

      const member = await guild.members.fetch(userId);
      const role = guild.roles.cache.get(process.env.ROLE_ID);
      if (!role) return res.send('<h1>Error: Role not found</h1>');

      await member.roles.add(role);
      console.log(`Role added to ${userId}`);

      setTimeout(async () => {
        try {
          await member.roles.remove(role);
          console.log(`Role removed from ${userId}`);
        } catch (e) {
          console.log('Remove error:', e);
        }
      }, 3600 * 1000);

      res.send('<h1 style="color:#0f0;text-align:center;padding:100px;">Success! Role added for 1 hour.</h1>');
    } catch (err) {
      console.log('Error:', err.message);
      res.send('<h1 style="color:red;text-align:center;padding:100px;">Error: ' + err.message + '</h1>');
    }
  } else {
    res.send('<h1 style="color:red;text-align:center;padding:100px;">Invalid or expired key</h1>');
  }
});

// Bot login
discordClient.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('Bot login failed:', err);
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
