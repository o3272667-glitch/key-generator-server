import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";
import {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle
} from "discord.js";

dotenv.config();
const app = express();

// Render keep-alive
app.get("/", (req, res) => res.send("Bot backend active."));

// Offerwall oldal
app.use(express.static("./"));

// CPAGrip redirect után hívódik
app.get("/complete", (req, res) => {
  const uid = req.query.uid;
  if (!uid) return res.send("Missing UID");

  const key = Math.random().toString(36).substring(2, 10).toUpperCase();

  storeKey(uid, key);

  res.send(`
     <h1>Your key is ready!</h1>
     <p>Use this key in Discord:</p>
     <h2>${key}</h2>
  `);
});

// Key tárolása (RAM)
let keys = {};

function storeKey(uid, key) {
  keys[key] = { uid, valid: true };
}

// ---------- DISCORD BOT ----------

const TOKEN = process.env.DISCORD_TOKEN;
const ROLE_ID = "1440435434416115732";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const commands = [
  new SlashCommandBuilder()
    .setName("generate-key")
    .setDescription("Generate a key by completing an offer."),
  new SlashCommandBuilder()
    .setName("redeem-key")
    .setDescription("Redeem a generated key.")
    .addStringOption(o =>
      o.setName("key")
        .setDescription("Your generated key")
        .setRequired(true)
    )
].map(c => c.toJSON());

client.once("ready", async () => {
  console.log("Bot is online.");

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), {
    body: commands
  });
});

// Slash parancsok kezelése
client.on("interactionCreate", async (i) => {
  if (!i.isChatInputCommand()) return;

  // ------ OFFER GOMB ------
  if (i.commandName === "generate-key") {
    const url = `https://key-generator-server-1.onrender.com/offerwall.html?uid=${i.user.id}`;

    const btn = new ButtonBuilder()
      .setLabel("Complete Offer")
      .setStyle(ButtonStyle.Link)
      .setURL(url);

    return i.reply({
      content: "Click to generate your key:",
      components: [new ActionRowBuilder().addComponents(btn)]
    });
  }

  // ------ REDEEM ------
  if (i.commandName === "redeem-key") {
    const key = i.options.getString("key");

    const data = keys[key];
    if (!data || !data.valid || data.uid !== i.user.id)
      return i.reply("Invalid key or it doesn't belong to you.");

    data.valid = false;

    const member = await i.guild.members.fetch(i.user.id);
    await member.roles.add(ROLE_ID);

    i.reply("You now have access for 1 hour!");

    setTimeout(async () => {
      const mem = await i.guild.members.fetch(i.user.id);
      mem.roles.remove(ROLE_ID).catch(() => {});
    }, 3600000);
  }
});

client.login(TOKEN);

// Backend port

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

let completedUsers = {}; // ide mentjük ki teljesített

// POSTBACK HANDLER
app.post("/postback", (req, res) => {
    const password = req.body.password;
    const trackingID = req.body.tracking_id;
    const payout = req.body.payout;

    // Ha használsz postback jelszót, IDE írd be:
    const expectedPassword = "mypostbackpass";

    if (password && password !== expectedPassword) {
        return res.status(403).send("Wrong password");
    }

    if (!trackingID) {
        return res.status(400).send("Missing tracking_id");
    }

    // Generálunk kulcsot
    const key = "KEY-" + Math.random().toString(36).substring(2, 10).toUpperCase();

    // Elmentjük a userhez
    completedUsers[trackingID] = {
        key: key,
        payout: payout || 0
    };

    console.log("✔ Postback received for UID:", trackingID, "KEY:", key);

    res.send("OK");
});

// LEKÉRDEZÉS – használja a Discord bot
app.get("/getkey", (req, res) => {
    const uid = req.query.uid;

    if (!uid || !completedUsers[uid]) {
        return res.json({ success: false, message: "Not completed yet" });
    }

    res.json({
        success: true,
        key: completedUsers[uid].key
    });
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running");
});
