require('dotenv').config({ quiet: true });

const path = require('path');
const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');
const { YoutubeExtractor } = require('discord-player-youtubei');

const { createClient } = require('./client');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const registerPlayerEvents = require('./music/playerEvents');
const logger = require('./utils/logger');

try {
  const ffmpegPath = require('ffmpeg-static');
  if (ffmpegPath) process.env.FFMPEG_PATH = ffmpegPath;
} catch {
  logger.warn('ffmpeg-static is not installed; music transcoding may fail if ffmpeg is not on PATH.');
}

const client = createClient();

async function start() {
  const { DISCORD_TOKEN } = process.env;
  if (!DISCORD_TOKEN) {
    logger.error('Missing DISCORD_TOKEN. Copy .env.example to .env and fill it in.');
    process.exitCode = 1;
    return;
  }

  const player = new Player(client);
  await player.extractors.register(YoutubeExtractor, {});
  await player.extractors.loadMulti(DefaultExtractors);
  client.player = player;

  loadCommands(client);
  loadEvents(client);
  registerPlayerEvents(client, player);

  await client.login(DISCORD_TOKEN);
}

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    logger.info(`Received ${signal}, shutting down...`);
    try {
      if (client.player) client.player.destroy();
      if (client.isReady()) client.destroy();
    } catch (err) {
      logger.error('Error during shutdown:', err.message);
    }
    process.exitCode = 0;
  });
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
});

start().catch((err) => {
  logger.error('Failed to start the bot:', err);
  process.exitCode = 1;
});
