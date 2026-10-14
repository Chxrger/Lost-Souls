const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireQueue, toArray } = require('../../utils/music');

module.exports = {
  data: new SlashCommandBuilder().setName('skip').setDescription('Skip the current track.'),

  async execute(interaction, client) {
    const queue = await requireQueue(client, interaction);
    if (!queue) return;

    const upcoming = toArray(queue.tracks).length;
    if (upcoming === 0) {
      queue.node.skip();
      return interaction.reply({ embeds: [embeds.info('Skipped the last track.')] });
    }

    const current = queue.currentTrack;
    queue.node.skip();
    return interaction.reply({
      embeds: [embeds.success(`Skipped **${current?.title || 'the current track'}**.`)]
    });
  }
};
