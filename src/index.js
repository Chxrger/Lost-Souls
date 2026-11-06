require('dotenv').config({ quiet: true });

const { Player } = require('discord-player');
const { DefaultExtractors } = require('@discord-player/extractor');

const { createClient } = require('./client');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const registerPlayerEvents = require('./music/playerEvents');
const { SafeYoutubeExtractor } = require('./music/youtubeExtractor');
const logger = require('./utils/logger');

function checkMusicDependencies() {
  try {
    const { FFmpeg } = require('@discord-player/ffmpeg');
    const resolved = FFmpeg.resolveSafe();
    if (resolved) {
      logger.info(`ffmpeg ready: ${resolved.version} (${resolved.command})`);
    } else {
      logger.error(
        'ffmpeg could not be found. Music playback will fail. Install ffmpeg on the host, or re-run the ffmpeg-static installer (node node_modules/ffmpeg-static/install.js).'
      );
    }
  } catch (err) {
    logger.warn(`Could not verify ffmpeg: ${err.message}`);
  }

  try {
    const mediaplex = require('mediaplex');
    const opus = typeof mediaplex.getOpusVersion === 'function' ? mediaplex.getOpusVersion() : 'unknown';
    logger.info(`mediaplex ready (opus ${opus}).`);
  } catch (err) {
    logger.warn(`mediaplex is unavailable (${err.message}); voice encoding may fail.`);
  }
}

const client = createClient();

async function start() {
  const { DISCORD_TOKEN } = process.env;
  if (!DISCORD_TOKEN) {
    logger.error('Missing DISCORD_TOKEN. Copy .env.example to .env and fill it in.');
    process.exitCode = 1;
    return;
  }

  checkMusicDependencies();

  const extractorOptions = {};
  if (process.env.YOUTUBE_COOKIE) {
    extractorOptions.cookie = process.env.YOUTUBE_COOKIE;
    logger.info('Using YOUTUBE_COOKIE for YouTube requests.');
  }
  if (process.env.YOUTUBE_DISABLE_PLAYER === 'true') extractorOptions.disablePlayer = true;

  if (process.env.YOUTUBE_PROXY) {
    try {
      const { ProxyAgent } = require('undici');
      extractorOptions.proxy = new ProxyAgent(process.env.YOUTUBE_PROXY);
      logger.info('Using YOUTUBE_PROXY for YouTube requests.');
    } catch (err) {
      logger.warn(`Could not enable YOUTUBE_PROXY: ${err.message}`);
    }
  }

  const player = new Player(client);
  await player.extractors.register(SafeYoutubeExtractor, extractorOptions);
  await player.extractors.loadMulti(DefaultExtractors);
  client.player = player;

  if (typeof player.extractors?.store?.size === 'number') {
    logger.info(`Registered ${player.extractors.store.size} extractor(s).`);
  }

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
