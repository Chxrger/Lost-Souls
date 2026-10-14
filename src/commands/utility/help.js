const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

const CATEGORY_LABELS = {
  moderation: 'Moderation',
  roles: 'Role Management',
  music: 'Music',
  config: 'Configuration',
  utility: 'Utility'
};

module.exports = {
  data: new SlashCommandBuilder().setName('help').setDescription('List all available commands.'),

  async execute(interaction, client) {
    const grouped = new Map();
    for (const command of client.commands.values()) {
      const category = command.category || 'utility';
      if (!grouped.has(category)) grouped.set(category, []);
      grouped.get(category).push(command.data.name);
    }

    const embed = new EmbedBuilder()
      .setColor(embeds.COLORS.info)
      .setTitle('Commands')
      .setDescription('Here is everything I can do.');

    for (const [category, names] of grouped) {
      embed.addFields({
        name: CATEGORY_LABELS[category] || category,
        value: names.sort().map((name) => `\`/${name}\``).join(' ')
      });
    }

    return interaction.reply({ embeds: [embed] });
  }
};
