const { Events, PermissionsBitField } = require('discord.js');
const { stores } = require('../utils/store');
const embeds = require('../utils/embeds');
const { isWhitelisted } = require('../utils/permissions');
const logger = require('../utils/logger');

const INVITE_REGEX = /(discord\.gg|discord(?:app)?\.com\/invite)\/[a-z0-9-]+/i;
const LINK_REGEX = /https?:\/\/\S+/i;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function detectViolation(content, automod) {
  const words = (automod.filteredWords || []).filter(Boolean);
  if (words.length > 0) {
    const pattern = new RegExp(`(?:^|\\W)(${words.map(escapeRegExp).join('|')})(?:\\W|$)`, 'i');
    if (pattern.test(content)) return 'a filtered word';
  }
  if (automod.blockInvites && INVITE_REGEX.test(content)) return 'a Discord invite link';
  if (automod.blockLinks && LINK_REGEX.test(content)) return 'a link';
  return null;
}

module.exports = {
  name: Events.MessageCreate,
  async execute(client, message) {
    if (!message.guild || message.author.bot) return;

    const config = stores.config.get();
    const automod = config.automod;
    if (!automod || !automod.enabled) return;

    if ((automod.ignoreChannels || []).includes(message.channelId)) return;
    if (isWhitelisted(message.member, automod)) return;

    const reason = detectViolation(message.content || '', automod);
    if (!reason) return;

    if (automod.deleteMessage && message.deletable) {
      const me = message.guild.members.me;
      if (me?.permissionsIn(message.channel).has(PermissionsBitField.Flags.ManageMessages)) {
        await message.delete().catch(() => {});
      }
    }

    if (automod.warnUser && message.channel.isTextBased()) {
      const warning = await message.channel
        .send({ content: `${message.author}, your message was removed because it contained ${reason}.` })
        .catch(() => null);
      if (warning) setTimeout(() => warning.delete().catch(() => {}), 6000);
    }

    if (config.logChannelId) {
      const logChannel = message.guild.channels.cache.get(config.logChannelId);
      if (logChannel?.isTextBased()) {
        const embed = embeds.warn(
          `Automod removed a message from ${message.author} in ${message.channel}.\n**Reason:** ${reason}\n**Content:** ${
            (message.content || '').slice(0, 1000) || '*empty*'
          }`
        );
        await logChannel.send({ embeds: [embed] }).catch(() => {});
      }
    }

    logger.info(`Automod removed message ${message.id} in ${message.guild.id}: ${reason}.`);
  }
};
