const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireQueue } = require('../../utils/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Stop playback, clear the queue and leave the voice channel.'),

  async execute(interaction, client) {
    const queue = await requireQueue(client, interaction);
    if (!queue) return;

    queue.delete();
    return interaction.reply({ embeds: [embeds.success('Stopped playback and cleared the queue.')] });
  }
};
