const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireQueue } = require('../../utils/music');

module.exports = {
  data: new SlashCommandBuilder().setName('resume').setDescription('Resume the current track.'),

  async execute(interaction, client) {
    const queue = await requireQueue(client, interaction);
    if (!queue) return;

    if (!queue.node.isPaused()) {
      return interaction.reply({ embeds: [embeds.info('The player is already playing.')], flags: MessageFlags.Ephemeral });
    }

    queue.node.resume();
    return interaction.reply({ embeds: [embeds.success('Resumed playback.')] });
  }
};
