const { stores } = require('./store');

function normalizeEmoji(input) {
  if (!input) return null;
  const value = String(input).trim();
  const mention = value.match(/^<a?:(\w+):(\d+)>$/);
  if (mention) return `${mention[1]}:${mention[2]}`;
  const named = value.match(/^:?(\w+):(\d+)$/);
  if (named) return `${named[1]}:${named[2]}`;
  return value;
}

function keyFromReaction(emoji) {
  if (!emoji) return null;
  return emoji.id ? `${emoji.name}:${emoji.id}` : emoji.name;
}

function getMessages() {
  return stores.reactionRoles.get().messages || [];
}

function findPair(messageId, emoji) {
  const key = keyFromReaction(emoji);
  if (!key) return null;
  for (const entry of getMessages()) {
    if (entry.messageId !== messageId) continue;
    const pair = (entry.pairs || []).find((p) => p.emoji === key);
    if (pair) return { entry, pair };
  }
  return null;
}

module.exports = {
  normalizeEmoji,
  keyFromReaction,
  getMessages,
  findPair
};
