import express from "express";
import dotenv from "dotenv";
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

// ------------------- STATIC FILES -------------------
app.use(express.static("./")); // offerwall.html itt lesz

// ------------------- EXPRESS BASE -------------------
app.get("/", (req, res) => {
  res.send("Backend active");
});

// ==================  MEMORY DB ==================
let completedUsers = {}; // { uid: { key, payout } }

// ==================  POSTBACK HANDLER ==================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/postback", (req, res) => {
  const expectedPassword = "mypostbackpass";

  const {
    password,
    tracking_id,
    payout
  } = req.body;

  if (password && password !== expectedPassword) {
    return res.status(403).send("Wrong password");
  }

  if (!tracking_id) return res.status(400).send("Missing tracking_id");

  const key =
    "KEY-" + Math.random().toString(36).substring(2, 10).toUpperCase();

  completedUsers[tracking_id] = {
    key,
    payout: payout || 0
  };

  console.log("✔ Postback:", tracking_id, "->", key);
  res.send("OK");
});

// ==================  KEY CHECK ==================
app.get("/getkey", (req, res) => {
  const uid = req.query.uid;
  if (!uid || !completedUsers[uid]) {
    return res.json({ success: false });
  }

  res.json({
    success: true,
    key: completedUsers[uid].key
  });
});

// ==================  DISCORD BOT ==================
const TOKEN = process.env.DISCORD_TOKEN;
const ROLE_ID = process.env.ROLE_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const commands = [
  new SlashCommandBuilder()
    .setName("generate-key")
    .setDescription("Generate a key by completing an offer."),

  new SlashCommandBuilder()
    .setName("redeem-key")
    .setDescription("Redeem a completed key.")
    .addStringOption(o =>
      o.setName("key")
        .setDescription("Generated key")
        .setRequired(true)
    )
].map(c => c.toJSON());

client.once("ready", async () => {
  console.log("Bot ready.");

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(Routes.applicationCommands(client.user.id), {
    body: commands
  });
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // 1️⃣ Generate Link
  if (interaction.commandName === "generate-key") {
    const offerURL = `${process.env.SERVER_URL}/offerwall.html?uid=${interaction.user.id}`;

    const btn = new ButtonBuilder()
      .setLabel("Complete Offer")
      .setStyle(ButtonStyle.Link)
      .setURL(offerURL);

    return interaction.reply({
      content: "Complete an offer to generate your key:",
      components: [new ActionRowBuilder().addComponents(btn)]
    });
  }

  // 2️⃣ Redeem
  if (interaction.commandName === "redeem-key") {
    const inputKey = interaction.options.getString("key");

    const found = Object.values(completedUsers).find(x => x.key === inputKey);

    if (!found)
      return interaction.reply("Invalid key");

    const correctUser = Object.keys(completedUsers).find(
      uid => completedUsers[uid].key === inputKey
    );

    if (correctUser !== interaction.user.id)
      return interaction.reply("This key doesn't belong to you.");

    // role add
    const member = await interaction.guild.members.fetch(interaction.user.id);
    await member.roles.add(ROLE_ID);

    interaction.reply("Access granted for 1 hour!");

    setTimeout(() => {
      member.roles.remove(ROLE_ID).catch(() => {});
    }, 3600000);
  }
});

client.login(TOKEN);

// ------------------- SERVER LISTEN -------------------
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running.");
});
