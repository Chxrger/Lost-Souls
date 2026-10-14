const { Events } = require('discord.js');
const { findPair } = require('../utils/reactionRoles');
const logger = require('../utils/logger');

module.exports = {
  name: Events.MessageReactionAdd,
  async execute(client, reaction, user) {
    if (reaction.partial) {
      try {
        await reaction.fetch();
      } catch {
        return;
      }
    }
    if (user.partial) {
      try {
        await user.fetch();
      } catch {
        return;
      }
    }
    if (user.bot) return;

    const match = findPair(reaction.message.id, reaction.emoji);
    if (!match) return;

    const guild = reaction.message.guild;
    if (!guild) return;

    const member = await guild.members.fetch(user.id).catch(() => null);
    if (!member) return;

    const role = guild.roles.cache.get(match.pair.roleId);
    if (!role) return;

    try {
      await member.roles.add(role, 'Reaction role');
    } catch (err) {
      logger.warn(`Could not add reaction role ${role.id} to ${member.id}: ${err.message}`);
    }
  }
};
