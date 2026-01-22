const express = require('express');
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require('discord.js');

const app = express();
const port = process.env.PORT || 3000;

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
  console.log(`Bot online: ${client.user.tag}`);
});

// Teszt kulcs (cseréld saját ID-dre)
let codes = {};
const TESZT_USER_ID = 'IDEJÖJJÖNAZSÁJÁT_ID'; // Copy User ID magadról
codes[TESZT_USER_ID] = { code: 'TEST12345', expires: Date.now() + 300000 }; // 5 perc

// Egyszerű health check port-ra (Render-nek kell)
app.get('/', (req, res) => {
  res.send('Bot & Server running – redeem in Discord!');
});

// !setup parancs – embed gombokkal
client.on(Events.MessageCreate, async message => {
  if (message.content === '!setup') {
    if (!message.member.permissions.has('Administrator')) return message.reply('Admin only!');

    const embed = new EmbedBuilder()
      .setTitle('Redeem Key – Unlock Content')
      .setDescription('Get your key and unlock premium content!')
      .setColor('#ff69b4')
      .setImage('https://i.imgur.com/placeholder-teaser.jpg') // teaser kép
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

// Gombok
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

// Modal submit
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isModalSubmit()) return;

  if (interaction.customId === 'redeem_modal') {
    await interaction.deferReply({ ephemeral: true });

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

        await interaction.editReply({ content: 'Success! Role added permanently 🎉' });
      } catch (err) {
        console.log('Error:', err.message);
        await interaction.editReply({ content: 'Error adding role – contact admin' });
      }
    } else {
      await interaction.editReply({ content: 'Invalid or expired key' });
    }
  }
});

// Bot login
client.login(process.env.DISCORD_TOKEN).catch(err => {
  console.error('Bot login failed:', err);
});

// Server start – Render-nek kell
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
