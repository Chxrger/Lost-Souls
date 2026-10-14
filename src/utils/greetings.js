const { DEFAULT_CONFIG } = require('./store');
const logger = require('./logger');

const PLACEHOLDERS = ['{user}', '{mention}', '{username}', '{tag}', '{server}', '{memberCount}'];

function resolveSettings(config, type) {
  const fallback = DEFAULT_CONFIG[type];
  const stored = config?.[type] || {};
  return {
    enabled: stored.enabled ?? fallback.enabled,
    channelId: stored.channelId || (type === 'welcome' ? config?.welcomeChannelId : '') || '',
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

async function sendGreeting(member, type, config) {
  const settings = resolveSettings(config, type);
  if (!settings.enabled || !settings.channelId) return;

  const channel = member.guild?.channels?.cache?.get(settings.channelId);
  if (!channel?.isTextBased()) return;

  const text = format(pickRandom(settings.messages), member);

  try {
    await channel.send({ content: text, allowedMentions: { parse: ['users'] } });
  } catch (err) {
    logger.warn(`Failed to send ${type} message for ${member.id}: ${err.message}`);
  }
}

module.exports = {
  PLACEHOLDERS,
  resolveSettings,
  pickRandom,
  format,
  sendGreeting
};
