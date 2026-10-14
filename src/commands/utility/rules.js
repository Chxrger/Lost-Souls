const { SlashCommandBuilder } = require('discord.js');
const { stores } = require('../../utils/store');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('rules').setDescription('Show the server rules embed.'),

  async execute(interaction) {
    const entry = stores.embeds.get().rules;
    return interaction.reply({ embeds: [embeds.fromConfig(entry)] });
  }
};
