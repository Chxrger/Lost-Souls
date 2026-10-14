const { MessageFlags } = require('discord.js');
const embeds = require('./embeds');

function toArray(collection) {
  if (!collection) return [];
  if (Array.isArray(collection)) return collection;
  if (typeof collection.toArray === 'function') return collection.toArray();
  if (typeof collection.values === 'function') return Array.from(collection.values());
  return Array.from(collection);
}

function getQueue(client, interaction) {
  return client.player?.nodes?.get(interaction.guildId) || null;
}

async function replyError(interaction, message) {
  const payload = { embeds: [embeds.error(message)], flags: MessageFlags.Ephemeral };
  if (interaction.deferred) return interaction.editReply({ embeds: payload.embeds });
  if (interaction.replied) return interaction.followUp(payload);
  return interaction.reply(payload);
}

async function requireQueue(client, interaction) {
  const queue = getQueue(client, interaction);
  if (!queue) {
    await replyError(interaction, 'There is nothing playing right now.');
    return null;
  }
  return queue;
}

module.exports = {
  toArray,
  getQueue,
  replyError,
  requireQueue
};
