const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const { stores } = require('../../utils/store');
const embeds = require('../../utils/embeds');

const SETTINGS = [
  { name: 'Block invite links', value: 'blockInvites' },
  { name: 'Block all links', value: 'blockLinks' },
  { name: 'Delete offending messages', value: 'deleteMessage' },
  { name: 'Warn the user', value: 'warnUser' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Configure automatic message filtering.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('toggle')
        .setDescription('Turn automod on or off')
        .addBooleanOption((option) => option.setName('enabled').setDescription('Enable automod?').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('word')
        .setDescription('Add or remove a filtered word')
        .addStringOption((option) => option.setName('action').setDescription('Add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
        .addStringOption((option) => option.setName('word').setDescription('The word or phrase').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('setting')
        .setDescription('Toggle a filter behavior')
        .addStringOption((option) => option.setName('option').setDescription('Which setting').setRequired(true).addChoices(...SETTINGS))
        .addBooleanOption((option) => option.setName('enabled').setDescription('On or off').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('ignore-channel')
        .setDescription('Ignore or unignore a channel')
        .addStringOption((option) => option.setName('action').setDescription('Add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
        .addChannelOption((option) => option.setName('channel').setDescription('Channel').addChannelTypes(ChannelType.GuildText).setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('ignore-role')
        .setDescription('Ignore or unignore a role')
        .addStringOption((option) => option.setName('action').setDescription('Add or remove').setRequired(true).addChoices({ name: 'Add', value: 'add' }, { name: 'Remove', value: 'remove' }))
        .addRoleOption((option) => option.setName('role').setDescription('Role').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('status').setDescription('Show the current automod configuration')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'status') {
      const automod = stores.config.get().automod;
      return interaction.reply({
        embeds: [
          embeds
            .info()
            .setTitle('Automod')
            .addFields(
              { name: 'Enabled', value: automod.enabled ? 'Yes' : 'No', inline: true },
              { name: 'Block invites', value: automod.blockInvites ? 'Yes' : 'No', inline: true },
              { name: 'Block links', value: automod.blockLinks ? 'Yes' : 'No', inline: true },
              { name: 'Filtered words', value: automod.filteredWords.length ? automod.filteredWords.map((w) => `\`${w}\``).join(', ') : 'None' },
              { name: 'Ignored channels', value: automod.ignoreChannels.length ? automod.ignoreChannels.map((id) => `<#${id}>`).join(', ') : 'None' },
              { name: 'Ignored roles', value: automod.ignoreRoles.length ? automod.ignoreRoles.map((id) => `<@&${id}>`).join(', ') : 'None' }
            )
        ],
        flags: MessageFlags.Ephemeral
      });
    }

    let message;
    stores.config.update((config) => {
      const automod = config.automod;

      if (sub === 'toggle') {
        automod.enabled = interaction.options.getBoolean('enabled', true);
        message = `Automod is now **${automod.enabled ? 'enabled' : 'disabled'}**.`;
      }

      if (sub === 'word') {
        const action = interaction.options.getString('action', true);
        const word = interaction.options.getString('word', true).toLowerCase().trim();
        if (action === 'add') {
          if (!automod.filteredWords.includes(word)) automod.filteredWords.push(word);
          message = `Added \`${word}\` to the filter.`;
        } else {
          automod.filteredWords = automod.filteredWords.filter((item) => item !== word);
          message = `Removed \`${word}\` from the filter.`;
        }
      }

      if (sub === 'setting') {
        const option = interaction.options.getString('option', true);
        const enabled = interaction.options.getBoolean('enabled', true);
        automod[option] = enabled;
        message = `Set **${option}** to **${enabled ? 'on' : 'off'}**.`;
      }

      if (sub === 'ignore-channel') {
        const action = interaction.options.getString('action', true);
        const channel = interaction.options.getChannel('channel', true);
        if (action === 'add') {
          if (!automod.ignoreChannels.includes(channel.id)) automod.ignoreChannels.push(channel.id);
          message = `Automod now ignores ${channel}.`;
        } else {
          automod.ignoreChannels = automod.ignoreChannels.filter((id) => id !== channel.id);
          message = `Automod no longer ignores ${channel}.`;
        }
      }

      if (sub === 'ignore-role') {
        const action = interaction.options.getString('action', true);
        const role = interaction.options.getRole('role', true);
        if (action === 'add') {
          if (!automod.ignoreRoles.includes(role.id)) automod.ignoreRoles.push(role.id);
          message = `Automod now ignores members with ${role}.`;
        } else {
          automod.ignoreRoles = automod.ignoreRoles.filter((id) => id !== role.id);
          message = `Automod no longer ignores ${role}.`;
        }
      }
    });

    return interaction.reply({ embeds: [embeds.success(message)], flags: MessageFlags.Ephemeral });
  }
};
