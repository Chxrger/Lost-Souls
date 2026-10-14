const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { sendLog } = require('../../utils/logging');

const MAX_MINUTES = 28 * 24 * 60;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout (mute) a member for a number of minutes.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false)
    .addUserOption((option) => option.setName('user').setDescription('Member to timeout').setRequired(true))
    .addIntegerOption((option) =>
      option.setName('minutes').setDescription('Duration in minutes (1-40320)').setRequired(true).setMinValue(1).setMaxValue(MAX_MINUTES)
    )
    .addStringOption((option) => option.setName('reason').setDescription('Reason for the timeout')),

  async execute(interaction) {
    const user = interaction.options.getUser('user', true);
    const minutes = interaction.options.getInteger('minutes', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ embeds: [embeds.error('That user is not in this server.')], flags: MessageFlags.Ephemeral });
    }
    if (!member.moderatable) {
      return interaction.reply({
        embeds: [embeds.error('I cannot timeout that member (role hierarchy or missing permissions).')],
        flags: MessageFlags.Ephemeral
      });
    }

    await member.timeout(minutes * 60 * 1000, `${interaction.user.tag}: ${reason}`);

    await sendLog(
      interaction.guild,
      embeds.warn(`**${user.tag}** was timed out for ${minutes} minute(s) by ${interaction.user}.\n**Reason:** ${reason}`)
    );

    return interaction.reply({ embeds: [embeds.success(`Timed out **${user.tag}** for ${minutes} minute(s).`)] });
  }
};
