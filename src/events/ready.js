const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`Logged in as ${client.user.tag} (${client.user.id}).`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s).`);

    client.user.setPresence({
      status: 'online',
      activities: [{ name: 'Listening to a Ghost', type: ActivityType.Listening }]
    });
  }
};
