const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { sendLog } = require('../../utils/logging');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a member from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false)
    .addUserOption((option) => option.setName('user').setDescription('Member to ban').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('Reason for the ban'))
    .addIntegerOption((option) =>
      option.setName('delete_messages_days').setDescription('Delete this many days of their recent messages (0-7)').setMinValue(0).setMaxValue(7)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const days = interaction.options.getInteger('delete_messages_days') ?? 0;

    if (user.id === interaction.user.id) {
      return interaction.reply({ embeds: [embeds.error('You cannot ban yourself.')], flags: MessageFlags.Ephemeral });
    }
    if (user.id === interaction.client.user.id) {
      return interaction.reply({ embeds: [embeds.error('I cannot ban myself.')], flags: MessageFlags.Ephemeral });
    }

    const member = interaction.guild.members.cache.get(user.id);
    if (member && !member.bannable) {
      return interaction.reply({
        embeds: [embeds.error('I cannot ban that member (role hierarchy or missing permissions).')],
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.guild.members.ban(user.id, {
      reason: `${interaction.user.tag}: ${reason}`,
      deleteMessageSeconds: days * 24 * 60 * 60
    });

    await sendLog(
      interaction.guild,
      embeds.error(`**${user.tag}** was banned by ${interaction.user}.\n**Reason:** ${reason}`)
    );

    return interaction.reply({ embeds: [embeds.success(`Banned **${user.tag}**.`)] });
  }
};
