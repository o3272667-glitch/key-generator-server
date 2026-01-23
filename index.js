const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require('discord.js');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));

// Discord bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once(Events.ClientReady, () => {
  console.log(`Bot logged in as ${client.user.tag}`);
});

// Codes storage (in-memory for now)
let codes = {};

// Test code – replace TESZT_USER_ID with your own Discord ID (right-click yourself → Copy User ID)
const TESZT_USER_ID = 'YOUR_DISCORD_ID_HERE'; // ← PASTE YOUR 18-DIGIT ID HERE
codes[TESZT_USER_ID] = {
  code: 'TEST12345',
  expires: Date.now() + 300000 // 5 minutes
};

// Health check endpoint (Render needs this)
app.get('/', (req, res) => {
  res.send('Bot & server running – use !setup in Discord!');
});

// !setup command – creates embed with buttons
client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  if (message.content === '!setup') {
    if (!message.member.permissions.has('Administrator')) {
      return message.reply('Only admins can use this!');
    }

    const embed = new EmbedBuilder()
      .setTitle('Redeem Key – Unlock Content')
      .setDescription('Get your key and unlock premium content!')
      .setColor('#ff69b4')
      .setImage('https://i.imgur.com/placeholder-teaser.jpg') // replace with your teaser image URL
      .addFields({ name: 'Steps', value: '1. Click Generate Key\n2. Follow steps\n3. Redeem here' });

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('generate_key')
          .setLabel('Generate Key')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('redeem_key')
          .setLabel('Redeem Key')
          .setStyle(ButtonStyle.Success)
      );

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.reply({ content: 'Embed created! You can pin it.', ephemeral: true });
  }
});

// Button clicks
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  if (interaction.customId === 'generate_key') {
    await interaction.reply({ content: 'Generating... (BitLabs link coming soon)', ephemeral: true });
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

// Modal submit – code check + role add
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === 'redeem_modal') {
    await interaction.deferReply({ ephemeral: true });

    const code = interaction.fields.getTextInputValue('redeem_code').trim().toUpperCase();
    const userId = interaction.user.id;

    let valid = false;

    for (const uid in codes) {
      if (codes[uid].code === code && Date.now() < codes[uid].expires) {
        valid = true;
        delete codes[uid]; // one-time use
        break;
      }
    }

    if (valid) {
      try {
        const guild = interaction.guild;
        const member = await guild.members.fetch(userId);
        const role = guild.roles.cache.get(process.env.ROLE_ID);

        await member.roles.add(role);
        console.log(`Role added to ${userId} by ${interaction.user.tag}`);

        await interaction.editReply({ content: 'Success! Role added permanently 🎉' });
      } catch (err) {
        console.log('Role add error:', err.message);
        await interaction.editReply({ content: 'Error adding role – contact admin' });
      }
    } else {
      await interaction.editReply({ content: 'Invalid or expired key' });
    }
  }
});

// Login bot
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('Bot login failed:', err);
});

// Start Express server (Render requires a port)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
