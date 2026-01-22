const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, Events } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Teszt kulcs (cseréld a saját Discord ID-dre)
let codes = {};
const TESZT_USER_ID = 'IDEJÖJJÖNAZSÁJÁT_ID'; // jobb klikk magadra → Copy User ID
codes[TESZT_USER_ID] = { code: 'TEST12345', expires: Date.now() + 300000 }; // 5 perc

client.once(Events.ClientReady, () => {
  console.log(`Bot online: ${client.user.tag}`);
});

// !setup parancs – embed gombokkal
client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return; // ne reagáljon saját magára

  if (message.content === '!setup') {
    if (!message.member.permissions.has('Administrator')) return message.reply('Csak adminok használhatják!');

    const embed = new EmbedBuilder()
      .setTitle('Redeem Key – Unlock Content')
      .setDescription('Get your key and unlock premium content!')
      .setColor('#ff69b4')
      .setImage('https://i.imgur.com/placeholder-teaser.jpg') // cseréld teaser képre
      .addFields({ name: 'Steps', value: '1. Generate Key\n2. Follow steps\n3. Redeem here' });

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
    await message.reply({ content: 'Embed létrehozva! Pinelheted.', ephemeral: true });
  }
});

// Gomb kattintás
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

// Modal submit – redeem + rang adás
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
