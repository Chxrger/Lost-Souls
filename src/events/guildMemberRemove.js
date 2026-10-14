const { Events } = require('discord.js');
const { stores } = require('../utils/store');
const greetings = require('../utils/greetings');

module.exports = {
  name: Events.GuildMemberRemove,
  async execute(client, member) {
    const config = stores.config.get();
    await greetings.sendGreeting(member, 'leave', config);
  }
};
