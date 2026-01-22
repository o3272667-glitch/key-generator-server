const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require('discord.js');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

// Discord bot
const discordClient = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

discordClient.once(Events.ClientReady, () => {
  console.log(`Bot online: ${discordClient.user.tag}`);
});

// Teszt kulcsok
let codes = {}; // később BitLabs generálja

// Egyszerű health check port-ra (Render-nek kell)
app.get('/', (req, res) => {
  res.send('Server & Bot running – go to Discord for redeem!');
});

// Redeem modal + gombok (a !setup parancs létrehoz embed-et gombokkal)
client.on(Events.MessageCreate, async message => {
  if (message.content === '!setup') {
    if (!message.member.permissions.has('Administrator')) return message.reply('Admin only!');

    const embed = new EmbedBuilder()
      .setTitle('Redeem Key – Unlock Content')
      .setDescription('Get your key and unlock premium content!')
      .setColor('#ff69b4')
      .setImage('https://i.imgur.com/placeholder-teaser.jpg') // cseréld
      .addFields({ name: 'Steps', value: '1. Generate Key\n2. Follow steps\n3. Redeem here' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('generate_key').setLabel('Generate Key').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('redeem_key').setLabel('Redeem Key').setStyle(ButtonStyle.Success)
      );

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.reply('Embed created! Pin it if needed.');
  }
});

// Gombok kezelése
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'generate_key') {
    await interaction.reply({ content: 'Generating... (BitLabs soon)', ephemeral: true });
  }

  if (interaction.customId === 'redeem_key') {
    const modal = new ModalBuilder()
      .setCustomId('redeem_modal')
      .setTitle('Redeem Your Key');

    const codeInput = new TextInputBuilder()
      .setCustomId('redeem_code')
      .setLabel('Paste your key')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('KM-XXXX-XXXX-XXXX')
      .setRequired(true)
      .setMaxLength(64);

    modal.addComponents(new ActionRowBuilder().addComponents(codeInput));

    await interaction.showModal(modal);
  }
});

// Modal submit – redeem + rang adás
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === 'redeem_modal') {
    const code = interaction.fields.getTextInputValue('redeem_code').trim().toUpperCase();

    let valid = false;
    const userId = interaction.user.id;

    for (const uid in codes) {
      if (codes[uid].code === code && Date.now() < codes[uid].expires) {
        valid = true;
        delete codes[uid];
        break;
      }
    }

    if (valid) {
      try {
        const guild = interaction.guild;
        const member = await guild.members.fetch(userId);
        const role = guild.roles.cache.get(process.env.ROLE_ID);

        await member.roles.add(role);
        console.log(`Role added to ${userId}`);

        await interaction.reply({ content: 'Success! Role added permanently 🎉', ephemeral: true });
      } catch (err) {
        console.log('Error:', err.message);
        await interaction.reply({ content: 'Error – contact admin', ephemeral: true });
      }
    } else {
      await interaction.reply({ content: 'Invalid or expired key', ephemeral: true });
    }
  }
});

// Bot login
discordClient.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('Bot login failed:', err);
});

// Server start (Render-nek kell port)
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
