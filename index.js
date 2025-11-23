import express from "express";
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
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

// ====== CONFIG ======
const TOKEN = process.env.DISCORD_TOKEN;
const OFFERWALL_URL = "https://offerwall.me/offerwall/y1otvbt4v4trgy0z2309oz5bihpnlm/"; 
const BACKEND_URL = "https://key-generator-server.onrender.com"; 
const ROLE_ID = "1440435434416115732";
// =====================

// ========== FAKE WEB SERVER (Render miatt) ==========
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Fake webserver running on port " + (process.env.PORT || 3000));
});
// =====================================================


// ========== DISCORD BOT ==========
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
       .setDescription("Your key")
       .setRequired(true)
    )
].map(c => c.toJSON());

client.once("ready", async () => {
  console.log("Bot online.");

  const rest = new REST({ version: "10" }).setToken(TOKEN);
  await rest.put(
    Routes.applicationCommands(client.user.id),
    { body: commands }
  );

  console.log("Commands registered.");
});


client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "generate-key") {

    const finalUrl = `${OFFERWALL_URL}${interaction.user.id}`;

    const btn = new ButtonBuilder()
      .setLabel("Generate Key")
      .setStyle(ButtonStyle.Link)
      .setURL(finalUrl);

    const row = new ActionRowBuilder().addComponents(btn);

    await interaction.reply({
      content: "Click the button to generate your key:",
      components: [row]
    });
  }

  if (interaction.commandName === "redeem-key") {
    const key = interaction.options.getString("key");

    const res = await fetch(
      `${BACKEND_URL}/redeem?key=${encodeURIComponent(key)}&user=${interaction.user.id}`
    );

    const data = await res.json().catch(() => ({ valid: false }));

    if (!data.valid) {
      return interaction.reply("Invalid key.");
    }

    // ROLE add
    const member = await interaction.guild.members.fetch(interaction.user.id);
    await member.roles.add(ROLE_ID);

    await interaction.reply("Access granted for 1 hour!");

    // REMOVE role after 1 hour
    setTimeout(async () => {
      const m = await interaction.guild.members.fetch(interaction.user.id).catch(() => {});
      if (m) m.roles.remove(ROLE_ID);
    }, 3600_000);
  }
});

client.login(TOKEN);
