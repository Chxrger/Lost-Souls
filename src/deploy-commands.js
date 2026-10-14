require('dotenv').config({ quiet: true });

const { REST, Routes } = require('discord.js');
const { collectCommands } = require('./handlers/commandHandler');
const logger = require('./utils/logger');

const { DISCORD_TOKEN, CLIENT_ID, GUILD_ID, EXTRA_GUILD_IDS } = process.env;

const guildIds = [GUILD_ID, ...(EXTRA_GUILD_IDS || '').split(',')]
  .map((id) => id && id.trim())
  .filter(Boolean);

async function deploy() {
  if (!DISCORD_TOKEN) throw new Error('Missing DISCORD_TOKEN in .env');
  if (!CLIENT_ID) throw new Error('Missing CLIENT_ID in .env');

  const body = collectCommands().map((command) => command.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

  if (guildIds.length > 0) {
    for (const guildId of guildIds) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), { body });
      logger.info(`Registered ${body.length} command(s) in guild ${guildId}.`);
    }
  } else {
    await rest.put(Routes.applicationCommands(CLIENT_ID), { body });
    logger.info(`Registered ${body.length} global command(s).`);
  }
}

deploy().catch((err) => {
  logger.error('Command deployment failed:', err);
  process.exitCode = 1;
});
