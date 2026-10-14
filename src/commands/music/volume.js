const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireQueue } = require('../../utils/music');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('volume')
    .setDescription('Change the player volume (0-100).')
    .addIntegerOption((option) =>
      option.setName('level').setDescription('Volume level 0-100').setRequired(true).setMinValue(0).setMaxValue(100)
    ),

  async execute(interaction, client) {
    const queue = await requireQueue(client, interaction);
    if (!queue) return;

    const level = interaction.options.getInteger('level', true);
    queue.node.setVolume(level);
    return interaction.reply({ embeds: [embeds.success(`Volume set to **${level}%**.`)] });
  }
};
