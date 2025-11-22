// Fake webserver for Render
const express = require("express");
const app = express();

app.get("/", (req, res) => res.send("Bot is running."));
app.listen(process.env.PORT || 3000, () => {
  console.log("Fake webserver running on port " + (process.env.PORT || 3000));
});


import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle } from "discord.js";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

const TOKEN = process.env.DISCORD_TOKEN;
const OFFERWALL_URL = "https://offerwall.me/offerwall/[API_KEY]/"; 
const BACKEND_URL = "https://key-generator-server.onrender.com"; 
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
    .addStringOption(o=>o.setName("key").setDescription("Your key").setRequired(true))
].map(c=>c.toJSON());

client.once("ready", async () => {
  console.log("Bot online.");

  const rest = new REST({version:"10"}).setToken(TOKEN);
  const appId = client.user.id;

  await rest.put(Routes.applicationCommands(appId), {body: commands});
  console.log("Commands registered.");
});

client.on("interactionCreate", async (i)=>{
  if (i.isChatInputCommand()){
    if (i.commandName==="generate-key"){
      const btn = new ButtonBuilder()
        .setLabel("Generate Key")
        .setStyle(ButtonStyle.Link)
        .setURL(OFFERWALL_URL + i.user.id);
      const row = new ActionRowBuilder().addComponents(btn);
      await i.reply({content:"Kattints a gombra a kulcsgeneráláshoz:", components:[row]});
    }

    if (i.commandName==="redeem-key"){
      const key = i.options.getString("key");
      const res = await fetch(`${BACKEND_URL}/redeem?key=${encodeURIComponent(key)}&user=${i.user.id}`);
      const data = await res.json().catch(()=>({valid:false}));

      if (!data.valid) return i.reply("Érvénytelen kulcs.");

      const member = await i.guild.members.fetch(i.user.id);
      await member.roles.add(ROLE_ID);
      i.reply("Rang megadva 1 órára.");

      setTimeout(async ()=>{
        const mem = await i.guild.members.fetch(i.user.id);
        mem.roles.remove(ROLE_ID).catch(()=>{});
      }, 3600_000);
    }
  }
});

client.login(TOKEN);
