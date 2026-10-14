const { SlashCommandBuilder } = require('discord.js');
const { stores } = require('../../utils/store');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('information').setDescription('Show the server information embed.'),

  async execute(interaction) {
    const entry = stores.embeds.get().information;
    return interaction.reply({ embeds: [embeds.fromConfig(entry)] });
  }
};
