const { Events } = require('discord.js');
const { findPair } = require('../utils/reactionRoles');
const logger = require('../utils/logger');

module.exports = {
  name: Events.MessageReactionRemove,
  async execute(client, reaction, user) {
    if (reaction.partial) {
      try {
        await reaction.fetch();
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

    if (!member.roles.cache.has(role.id)) return;

    try {
      await member.roles.remove(role, 'Reaction role removed');
    } catch (err) {
      logger.warn(`Could not remove reaction role ${role.id} from ${member.id}: ${err.message}`);
    }
  }
};
