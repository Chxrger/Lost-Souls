const { Events } = require('discord.js');
const { stores } = require('../utils/store');
const greetings = require('../utils/greetings');
const logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(client, member) {
    logger.debug(`Member left: ${member.id} in ${member.guild.id}.`);
    const config = stores.config.get();
    await greetings.sendGreeting(member, 'leave', config);
  }
};
