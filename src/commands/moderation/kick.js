const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { sendLog } = require('../../utils/logging');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a member from the server.')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false)
    .addUserOption((option) => option.setName('user').setDescription('Member to kick').setRequired(true))
    .addStringOption((option) => option.setName('reason').setDescription('Reason for the kick')),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    if (user.id === interaction.user.id) {
      return interaction.reply({ embeds: [embeds.error('You cannot kick yourself.')], flags: MessageFlags.Ephemeral });
    }

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ embeds: [embeds.error('That user is not in this server.')], flags: MessageFlags.Ephemeral });
    }
    if (!member.kickable) {
      return interaction.reply({
        embeds: [embeds.error('I cannot kick that member (role hierarchy or missing permissions).')],
        flags: MessageFlags.Ephemeral
      });
    }

    await member.kick(`${interaction.user.tag}: ${reason}`);

    await sendLog(
      interaction.guild,
      embeds.warn(`**${user.tag}** was kicked by ${interaction.user}.\n**Reason:** ${reason}`)
    );

    return interaction.reply({ embeds: [embeds.success(`Kicked **${user.tag}**.`)] });
  }
};
