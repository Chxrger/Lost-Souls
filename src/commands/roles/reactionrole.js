const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { stores } = require('../../utils/store');
const { normalizeEmoji, getMessages } = require('../../utils/reactionRoles');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reactionrole')
    .setDescription('Set up emoji reaction roles.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Link an emoji on a message to a role')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('Channel of the message').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addStringOption((option) => option.setName('message_id').setDescription('ID of the message').setRequired(true))
        .addStringOption((option) => option.setName('emoji').setDescription('Unicode emoji or custom emoji like <:name:id>').setRequired(true))
        .addRoleOption((option) => option.setName('role').setDescription('Role to give').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Unlink an emoji from a role')
        .addChannelOption((option) =>
          option.setName('channel').setDescription('Channel of the message').addChannelTypes(ChannelType.GuildText).setRequired(true)
        )
        .addStringOption((option) => option.setName('message_id').setDescription('ID of the message').setRequired(true))
        .addStringOption((option) => option.setName('emoji').setDescription('Emoji to unlink').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List all reaction role messages')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    if (sub === 'list') {
      const messages = getMessages().filter((entry) => !entry.guildId || entry.guildId === guild.id);
      if (messages.length === 0) {
        return interaction.reply({ embeds: [embeds.info('No reaction roles configured.')], flags: MessageFlags.Ephemeral });
      }
      const description = messages
        .map((entry) => {
          const pairs = (entry.pairs || [])
            .map((pair) => `${pair.emoji} → ${guild.roles.cache.get(pair.roleId)?.toString() || pair.roleId}`)
            .join('\n');
          return `<#${entry.channelId}> • message \`${entry.messageId}\`\n${pairs}`;
        })
        .join('\n\n');
      return interaction.reply({ embeds: [embeds.info().setTitle('Reaction Roles').setDescription(description)], flags: MessageFlags.Ephemeral });
    }

    const channel = interaction.options.getChannel('channel', true);
    const messageId = interaction.options.getString('message_id', true).trim();
    const emojiInput = interaction.options.getString('emoji', true);
    const emoji = normalizeEmoji(emojiInput);

    const message = await channel.messages.fetch(messageId).catch(() => null);
    if (!message) {
      return interaction.reply({ embeds: [embeds.error('I could not find that message in the given channel.')], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'remove') {
      let removed = false;
      stores.reactionRoles.update((data) => {
        for (const entry of data.messages || []) {
          if (entry.messageId !== messageId) continue;
          const before = entry.pairs.length;
          entry.pairs = entry.pairs.filter((pair) => pair.emoji !== emoji);
          if (entry.pairs.length !== before) removed = true;
        }
        data.messages = (data.messages || []).filter((entry) => entry.pairs.length > 0);
      });

      if (!removed) {
        return interaction.reply({ embeds: [embeds.error('That emoji is not linked to a role on this message.')], flags: MessageFlags.Ephemeral });
      }
      return interaction.reply({ embeds: [embeds.success(`Unlinked ${emojiInput} from its role.`)] });
    }

    const role = interaction.options.getRole('role', true);
    const me = guild.members.me;
    if (role.position >= me.roles.highest.position) {
      return interaction.reply({
        embeds: [embeds.error('That role is higher than my highest role, so I cannot hand it out.')],
        flags: MessageFlags.Ephemeral
      });
    }

    let added = false;
    stores.reactionRoles.update((data) => {
      data.messages = data.messages || [];
      let entry = data.messages.find((item) => item.messageId === messageId);
      if (!entry) {
        entry = { guildId: guild.id, channelId: channel.id, messageId, pairs: [] };
        data.messages.push(entry);
      }
      if (!entry.pairs.some((pair) => pair.emoji === emoji)) {
        entry.pairs.push({ emoji, roleId: role.id });
        added = true;
      }
    });

    await message.react(emojiInput).catch(() => {});

    if (!added) {
      return interaction.reply({ embeds: [embeds.info('That emoji is already linked to a role on this message.')], flags: MessageFlags.Ephemeral });
    }

    return interaction.reply({
      embeds: [embeds.success(`Reacting with ${emojiInput} now grants ${role}.`)]
    });
  }
};
