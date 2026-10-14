const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { sendLog } = require('../../utils/logging');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Add or remove a role from a member.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Give a role to a member')
        .addUserOption((option) => option.setName('user').setDescription('Member').setRequired(true))
        .addRoleOption((option) => option.setName('role').setDescription('Role to add').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a role from a member')
        .addUserOption((option) => option.setName('user').setDescription('Member').setRequired(true))
        .addRoleOption((option) => option.setName('role').setDescription('Role to remove').setRequired(true))
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const user = interaction.options.getUser('user', true);
    const role = interaction.options.getRole('role', true);

    const me = interaction.guild.members.me;
    if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ embeds: [embeds.error('I need the **Manage Roles** permission.')], flags: MessageFlags.Ephemeral });
    }
    if (role.position >= me.roles.highest.position) {
      return interaction.reply({
        embeds: [embeds.error('That role is higher than my highest role, so I cannot manage it.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const member = await interaction.guild.members.fetch(user.id).catch(() => null);
    if (!member) {
      return interaction.reply({ embeds: [embeds.error('That user is not in this server.')], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'add') {
      if (member.roles.cache.has(role.id)) {
        return interaction.reply({ embeds: [embeds.info(`${user} already has ${role}.`)], flags: MessageFlags.Ephemeral });
      }
      await member.roles.add(role, `${interaction.user.tag} via /role add`);
      await sendLog(interaction.guild, embeds.info(`${interaction.user} gave ${role} to ${user}.`));
      return interaction.reply({ embeds: [embeds.success(`Gave ${role} to ${user}.`)] });
    }

    if (!member.roles.cache.has(role.id)) {
      return interaction.reply({ embeds: [embeds.info(`${user} does not have ${role}.`)], flags: MessageFlags.Ephemeral });
    }
    await member.roles.remove(role, `${interaction.user.tag} via /role remove`);
    await sendLog(interaction.guild, embeds.info(`${interaction.user} removed ${role} from ${user}.`));
    return interaction.reply({ embeds: [embeds.success(`Removed ${role} from ${user}.`)] });
  }
};
