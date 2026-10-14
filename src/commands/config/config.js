const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const { stores } = require('../../utils/store');
const embeds = require('../../utils/embeds');

const TARGETS = [
  { name: 'Information', value: 'information' },
  { name: 'Rules', value: 'rules' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configure the bot (embeds, channels).')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('edit')
        .setDescription('Edit an embed')
        .addStringOption((option) => option.setName('target').setDescription('Which embed').setRequired(true).addChoices(...TARGETS))
        .addStringOption((option) => option.setName('title').setDescription('Embed title'))
        .addStringOption((option) => option.setName('description').setDescription('Embed description').setMaxLength(4000))
        .addStringOption((option) => option.setName('color').setDescription('Hex color, e.g. #57F287'))
        .addStringOption((option) => option.setName('footer').setDescription('Footer text'))
        .addStringOption((option) => option.setName('thumbnail').setDescription('Thumbnail image URL'))
        .addStringOption((option) => option.setName('image').setDescription('Main image URL'))
    )
    .addSubcommand((sub) =>
      sub
        .setName('add-field')
        .setDescription('Add a field to an embed')
        .addStringOption((option) => option.setName('target').setDescription('Which embed').setRequired(true).addChoices(...TARGETS))
        .addStringOption((option) => option.setName('name').setDescription('Field name').setRequired(true))
        .addStringOption((option) => option.setName('value').setDescription('Field value').setRequired(true))
        .addBooleanOption((option) => option.setName('inline').setDescription('Display inline'))
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear-fields')
        .setDescription('Remove all fields from an embed')
        .addStringOption((option) => option.setName('target').setDescription('Which embed').setRequired(true).addChoices(...TARGETS))
    )
    .addSubcommand((sub) =>
      sub
        .setName('log-channel')
        .setDescription('Set the moderation log channel')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('Channel for logs').addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('welcome-channel')
        .setDescription('Set the welcome message channel')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('Channel for welcomes').addChannelTypes(ChannelType.GuildText)
        )
    )
    .addSubcommand((sub) => sub.setName('view').setDescription('Preview a configured embed').addStringOption((option) => option.setName('target').setDescription('Which embed').setRequired(true).addChoices(...TARGETS)))
    .addSubcommand((sub) => sub.setName('reload').setDescription('Reload configuration from disk')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'edit') {
      const target = interaction.options.getString('target', true);
      stores.embeds.update((data) => {
        const entry = data[target];
        for (const key of ['title', 'description', 'color', 'footer', 'thumbnail', 'image']) {
          const value = interaction.options.getString(key);
          if (value !== null) entry[key] = value;
        }
      });
      return interaction.reply({ embeds: [embeds.success(`Updated the **${target}** embed.`)], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'add-field') {
      const target = interaction.options.getString('target', true);
      const name = interaction.options.getString('name', true);
      const value = interaction.options.getString('value', true);
      const inline = interaction.options.getBoolean('inline') ?? false;
      stores.embeds.update((data) => {
        data[target].fields = data[target].fields || [];
        data[target].fields.push({ name, value, inline });
      });
      return interaction.reply({ embeds: [embeds.success(`Added a field to the **${target}** embed.`)], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'clear-fields') {
      const target = interaction.options.getString('target', true);
      stores.embeds.update((data) => {
        data[target].fields = [];
      });
      return interaction.reply({ embeds: [embeds.success(`Cleared the fields of the **${target}** embed.`)], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'log-channel') {
      const channel = interaction.options.getChannel('channel');
      stores.config.update((config) => {
        config.logChannelId = channel ? channel.id : '';
      });
      return interaction.reply({
        embeds: [embeds.success(channel ? `Moderation logs will be sent to ${channel}.` : 'Moderation logging disabled.')],
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'welcome-channel') {
      const channel = interaction.options.getChannel('channel');
      stores.config.update((config) => {
        config.welcomeChannelId = channel ? channel.id : '';
      });
      return interaction.reply({
        embeds: [embeds.success(channel ? `Welcomes will be posted in ${channel}.` : 'Welcome messages disabled.')],
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'view') {
      const target = interaction.options.getString('target', true);
      const entry = stores.embeds.get()[target];
      return interaction.reply({ embeds: [embeds.fromConfig(entry)], flags: MessageFlags.Ephemeral });
    }

    stores.embeds.get();
    stores.config.get();
    return interaction.reply({ embeds: [embeds.success('Configuration reloaded.')], flags: MessageFlags.Ephemeral });
  }
};
