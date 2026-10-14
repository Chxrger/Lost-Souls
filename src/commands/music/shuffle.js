const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');
const { requireQueue, toArray } = require('../../utils/music');

module.exports = {
  data: new SlashCommandBuilder().setName('shuffle').setDescription('Shuffle the tracks in the queue.'),

  async execute(interaction, client) {
    const queue = await requireQueue(client, interaction);
    if (!queue) return;

    const count = toArray(queue.tracks).length;
    if (count < 2) {
      return interaction.reply({ embeds: [embeds.error('There are not enough tracks to shuffle.')] });
    }

    queue.tracks.shuffle();
    return interaction.reply({ embeds: [embeds.success(`Shuffled ${count} tracks.`)] });
  }
};
