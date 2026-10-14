const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const COMMANDS_DIR = path.join(__dirname, '..', 'commands');

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

function collectCommands() {
  const commands = [];
  for (const file of walk(COMMANDS_DIR)) {
    delete require.cache[require.resolve(file)];
    let command;
    try {
      command = require(file);
    } catch (err) {
      logger.error(`Failed to load command ${path.basename(file)}:`, err.message);
      continue;
    }
    if (!command || !command.data || typeof command.execute !== 'function') {
      logger.warn(`Skipping ${path.basename(file)}: missing "data" or "execute".`);
      continue;
    }
    command.category = path.basename(path.dirname(file));
    command.name = command.data.name;
    commands.push(command);
  }
  return commands;
}

function loadCommands(client) {
  client.commands.clear();
  for (const command of collectCommands()) {
    client.commands.set(command.data.name, command);
  }
  logger.info(`Loaded ${client.commands.size} command(s).`);
  return client.commands;
}

module.exports = {
  COMMANDS_DIR,
  collectCommands,
  loadCommands
};
