const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireQueue } = require('../../utils/music');

module.exports = {
  data: new SlashCommandBuilder().setName('pause').setDescription('Pause or resume the current track.'),

  async execute(interaction, client) {
    const queue = await requireQueue(client, interaction);
    if (!queue) return;

    const paused = queue.node.isPaused();
    if (paused) queue.node.resume();
    else queue.node.pause();

    return interaction.reply({
      embeds: [embeds.success(`Player ${paused ? 'resumed' : 'paused'}.`)]
    });
  }
};
