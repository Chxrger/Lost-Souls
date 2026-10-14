const { stores } = require('./store');

function getLogChannel(guild) {
  const { logChannelId } = stores.config.get();
  if (!logChannelId || !guild) return null;
  const channel = guild.channels.cache.get(logChannelId);
  return channel?.isTextBased() ? channel : null;
}

async function sendLog(guild, embed) {
  const channel = getLogChannel(guild);
  if (channel) await channel.send({ embeds: [embed] }).catch(() => {});
}

module.exports = { getLogChannel, sendLog };
