const { SlashCommandBuilder } = require('discord.js');
const { QueueRepeatMode } = require('discord-player');
const embeds = require('../../utils/embeds');
const { requireQueue } = require('../../utils/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('loop')
    .setDescription('Set the repeat mode for the queue.')
    .addStringOption((option) =>
      option
        .setName('mode')
        .setDescription('Repeat mode')
        .setRequired(true)
        .addChoices(
          { name: 'Off', value: 'off' },
          { name: 'Track', value: 'track' },
          { name: 'Queue', value: 'queue' },
          { name: 'Autoplay', value: 'autoplay' }
        )
    ),

  async execute(interaction, client) {
    const queue = await requireQueue(client, interaction);
    if (!queue) return;

    const mode = interaction.options.getString('mode', true);
    const map = {
      off: QueueRepeatMode.OFF,
      track: QueueRepeatMode.TRACK,
      queue: QueueRepeatMode.QUEUE,
      autoplay: QueueRepeatMode.AUTOPLAY
    };

    queue.setRepeatMode(map[mode]);
    return interaction.reply({ embeds: [embeds.success(`Loop mode set to **${mode}**.`)] });
  }
};
