const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const EVENTS_DIR = path.join(__dirname, '..', 'events');

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
  }
  return files;
}

function loadEvents(client) {
  let count = 0;
  for (const file of walk(EVENTS_DIR)) {
    delete require.cache[require.resolve(file)];
    let event;
    try {
      event = require(file);
    } catch (err) {
      logger.error(`Failed to load event ${path.basename(file)}:`, err.message);
      continue;
    }
    if (!event || !event.name || typeof event.execute !== 'function') {
      logger.warn(`Skipping event ${path.basename(file)}: missing "name" or "execute".`);
      continue;
    }
    const handler = (...args) => event.execute(client, ...args);
    if (event.once) client.once(event.name, handler);
    else client.on(event.name, handler);
    count += 1;
  }
  logger.info(`Loaded ${count} event listener(s).`);
  return count;
}

module.exports = {
  EVENTS_DIR,
  loadEvents
};
