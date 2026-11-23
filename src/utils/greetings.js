const { DEFAULT_CONFIG } = require('./store');
const logger = require('./logger');

const PLACEHOLDERS = ['{user}', '{mention}', '{username}', '{tag}', '{server}', '{memberCount}'];

function resolveSettings(config, type) {
  const fallback = DEFAULT_CONFIG[type];
  const stored = config?.[type] || {};

  // Older configs only had the top-level welcomeChannelId. Keep honouring it
  // for servers that were set up before per-type channel settings existed.
  const legacyChannelId = config?.welcomeChannelId || '';
  const channelId =
    typeof stored.channelId === 'string' ? stored.channelId : legacyChannelId;

  return {
    enabled: stored.enabled ?? fallback.enabled,
    channelId,
    messages:
      Array.isArray(stored.messages) && stored.messages.length > 0 ? stored.messages : fallback.messages
  };
}

function pickRandom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function format(template, member) {
  const username = member.user?.username || member.displayName || 'Someone';
  const values = {
    '{user}': `<@${member.id}>`,
    '{mention}': `<@${member.id}>`,
    '{username}': username,
    '{tag}': member.user?.tag || username,
    '{server}': member.guild?.name || 'the server',
    '{memberCount}': String(member.guild?.memberCount ?? '')
  };
  return template.replace(/\{(user|mention|username|tag|server|memberCount)\}/g, (match) => values[match] ?? match);
}

async function resolveChannel(member, type, channelId) {
  if (!channelId) return null;

  const cached = member.guild?.channels?.cache?.get(channelId);
  if (cached) return cached;

  try {
    return await member.guild.channels.fetch(channelId);
  } catch (err) {
    logger.warn(`Cannot use ${type} channel ${channelId} in ${member.guild?.id || 'unknown'}: ${err.message}`);
    return null;
  }
}

/** Returns true only when a greeting was actually sent. */
async function sendGreeting(member, type, config) {
  const settings = resolveSettings(config, type);
  const guildId = member.guild?.id || 'unknown';

  if (!settings.enabled) {
    logger.info(`${type} message skipped for ${member.id} in ${guildId}: messages are disabled.`);
    return false;
  }

  if (!settings.channelId) {
    logger.warn(
      `${type} message skipped for ${member.id} in ${guildId}: no channel configured. ` +
        `Set it with /welcome set-channel type:${type}.`
    );
    return false;
  }

  const channel = await resolveChannel(member, type, settings.channelId);
  if (!channel) return false;

  if (!channel.isTextBased() || !channel.send) {
    logger.warn(`${type} channel ${channel.id} in ${guildId} is not a text channel.`);
    return false;
  }

  const text = format(pickRandom(settings.messages), member);

  try {
    await channel.send({ content: text, allowedMentions: { parse: ['users'] } });
    logger.info(`Sent ${type} message for ${member.id} to #${channel.name} (${channel.id}).`);
    return true;
  } catch (err) {
    logger.warn(`Failed to send ${type} message for ${member.id} to ${channel.id}: ${err.message}`);
    return false;
  }
}

module.exports = {
  PLACEHOLDERS,
  resolveSettings,
  pickRandom,
  format,
  sendGreeting
};
