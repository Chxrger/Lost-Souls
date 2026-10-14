const { Events, ActivityType } = require('discord.js');
const logger = require('../utils/logger');

// How often the presence changes (milliseconds). 10 minutes by default.
const PRESENCE_ROTATE_MS = 10 * 60 * 1000;

// Add/remove entries freely. `type` is one of the ActivityType values.
// For Custom, `name` is the text shown after the emoji/prefix.
const PRESENCES = [
  { type: ActivityType.Playing, name: '🍔 Krusty Krab Simulator 🍔' },
  { type: ActivityType.Watching, name: 'Workers @ Wegmans' },
  { type: ActivityType.Listening, name: 'Krusty Krab Pizza' },
  { type: ActivityType.Competing, name: '👻 in the afterlife 👻' },
  { type: ActivityType.Watching, name: 'for `/help` ' },
  { type: ActivityType.Playing, name: 'Being the best Fry Cook at the Krusty Krab' },
  { type: ActivityType.Custom, name: 'Haunting the server 👻' }
];

function pickRandom(exclude) {
  const pool = PRESENCES.filter((presence) => presence !== exclude);
  if (pool.length === 0) return PRESENCES[0];
  return pool[Math.floor(Math.random() * pool.length)];
}

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`Logged in as ${client.user.tag} (${client.user.id}).`);
    logger.info(`Serving ${client.guilds.cache.size} guild(s).`);

    let current;
    const rotate = () => {
      current = pickRandom(current);
      client.user.setPresence({
        status: 'online',
        activities: [{ type: current.type, name: current.name }]
      });
      logger.debug(`Presence -> ${ActivityType[current.type] ?? current.type}: ${current.name}`);
    };

    rotate();

    clearInterval(client.presenceTimer);
    const timer = setInterval(rotate, PRESENCE_ROTATE_MS);
    timer.unref?.();
    client.presenceTimer = timer;
  }
};
