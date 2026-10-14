const { SlashCommandBuilder, ChannelType, MessageFlags } = require('discord.js');
const { stores } = require('../../utils/store');
const greetings = require('../../utils/greetings');
const embeds = require('../../utils/embeds');

const TYPES = [
  { name: 'Welcome', value: 'welcome' },
  { name: 'Leave', value: 'leave' }
];

function ensureBucket(config, type) {
  config[type] = config[type] || {};
  config[type].messages = config[type].messages || [];
  return config[type];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('welcome')
    .setDescription('Configure welcome and leave messages.')
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('set-channel')
        .setDescription('Set the channel for welcome or leave messages (omit to disable)')
        .addStringOption((option) => option.setName('type').setDescription('Which message').setRequired(true).addChoices(...TYPES))
        .addChannelOption((option) =>
          option.setName('channel').setDescription('Where to post').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName('add-message')
        .setDescription('Add a random message template')
        .addStringOption((option) => option.setName('type').setDescription('Which message').setRequired(true).addChoices(...TYPES))
        .addStringOption((option) => option.setName('message').setDescription('Template (supports placeholders)').setRequired(true).setMaxLength(1024))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove-message')
        .setDescription('Remove a message template by its number')
        .addStringOption((option) => option.setName('type').setDescription('Which message').setRequired(true).addChoices(...TYPES))
        .addIntegerOption((option) => option.setName('index').setDescription('The number shown in list-messages').setRequired(true).setMinValue(1))
    )
    .addSubcommand((sub) =>
      sub
        .setName('list-messages')
        .setDescription('List the message templates')
        .addStringOption((option) => option.setName('type').setDescription('Which message').setRequired(true).addChoices(...TYPES))
    )
    .addSubcommand((sub) =>
      sub
        .setName('clear-messages')
        .setDescription('Remove all message templates')
        .addStringOption((option) => option.setName('type').setDescription('Which message').setRequired(true).addChoices(...TYPES))
    )
    .addSubcommand((sub) =>
      sub
        .setName('toggle')
        .setDescription('Enable or disable a message type')
        .addStringOption((option) => option.setName('type').setDescription('Which message').setRequired(true).addChoices(...TYPES))
        .addBooleanOption((option) => option.setName('enabled').setDescription('Turn it on or off').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('test')
        .setDescription('Preview a random message')
        .addStringOption((option) => option.setName('type').setDescription('Which message').setRequired(true).addChoices(...TYPES))
        .addChannelOption((option) =>
          option.setName('channel').setDescription('Send the preview here').addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const type = interaction.options.getString('type', true);
    const config = stores.config.get();
    const settings = greetings.resolveSettings(config, type);

    if (sub === 'set-channel') {
      const channel = interaction.options.getChannel('channel');
      stores.config.update((data) => {
        ensureBucket(data, type).channelId = channel ? channel.id : '';
      });
      return interaction.reply({
        embeds: [
          embeds.success(
            channel ? `${type === 'welcome' ? 'Welcome' : 'Leave'} messages will post in ${channel}.` : `${type} messages disabled.`
          )
        ],
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'add-message') {
      const message = interaction.options.getString('message', true);
      stores.config.update((data) => {
        ensureBucket(data, type).messages.push(message);
      });
      return interaction.reply({
        embeds: [embeds.success(`Added a ${type} template (now ${settings.messages.length + 1}).`)],
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'remove-message') {
      const index = interaction.options.getInteger('index', true);
      if (index > settings.messages.length) {
        return interaction.reply({ embeds: [embeds.error(`There is no ${type} template #${index}.`)], flags: MessageFlags.Ephemeral });
      }
      const [removed] = stores.config.update((data) => {
        const bucket = ensureBucket(data, type);
        return bucket.messages.splice(index - 1, 1);
      });
      return interaction.reply({
        embeds: [embeds.success(`Removed ${type} template #${index}:\n>>> ${removed}`)],
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'list-messages') {
      const lines = settings.messages.map((msg, i) => `**${i + 1}.** ${msg}`);
      const body = lines.join('\n').slice(0, 4000) || 'No templates yet.';
      return interaction.reply({
        embeds: [
          embeds
            .info(body)
            .setTitle(`${type === 'welcome' ? 'Welcome' : 'Leave'} messages`)
            .setFooter({ text: 'Placeholders: {user} {username} {server} {memberCount}' })
        ],
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'clear-messages') {
      stores.config.update((data) => {
        ensureBucket(data, type).messages = [];
      });
      return interaction.reply({
        embeds: [embeds.success(`Cleared all ${type} templates. Defaults will be used.`)],
        flags: MessageFlags.Ephemeral
      });
    }

    if (sub === 'toggle') {
      const enabled = interaction.options.getBoolean('enabled', true);
      stores.config.update((data) => {
        ensureBucket(data, type).enabled = enabled;
      });
      return interaction.reply({
        embeds: [embeds.success(`${type === 'welcome' ? 'Welcome' : 'Leave'} messages are now **${enabled ? 'enabled' : 'disabled'}**.`)],
        flags: MessageFlags.Ephemeral
      });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;
    const text = greetings.format(greetings.pickRandom(settings.messages), interaction.member);

    const result = stores.config.get();
    const live = greetings.resolveSettings(result, type);
    if (!live.enabled) {
      return interaction.reply({
        embeds: [embeds.warn(`${type} messages are currently disabled.`)],
        flags: MessageFlags.Ephemeral
      });
    }

    await channel.send({ content: text, allowedMentions: { parse: ['users'] } });
    return interaction.reply({ embeds: [embeds.success(`Sent a ${type} preview to ${channel}.`)], flags: MessageFlags.Ephemeral });
  }
};
