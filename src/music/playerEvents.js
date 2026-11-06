const { EmbedBuilder } = require('discord.js');
const embeds = require('../utils/embeds');
const logger = require('../utils/logger');

function truncate(text, max = 400) {
  const value = String(text ?? 'Unknown error');
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

function nowPlayingEmbed(track) {
  const embed = new EmbedBuilder()
    .setColor(embeds.COLORS.music)
    .setAuthor({ name: 'Now Playing' })
    .setTitle(track.title)
    .setURL(track.url)
    .setDescription(`by **${track.author}**`)
    .addFields(
      { name: 'Duration', value: String(track.duration || 'LIVE'), inline: true },
      { name: 'Requested by', value: track.requestedBy ? `${track.requestedBy}` : 'Unknown', inline: true }
    );

  if (track.thumbnail) embed.setThumbnail(track.thumbnail);
  return embed;
}

module.exports = function registerPlayerEvents(client, player) {
  const debugEnabled = (process.env.LOG_LEVEL || '').toLowerCase() === 'debug';

  player.events.on('playerStart', (queue, track) => {
    const channel = queue.metadata?.channel;
    if (!channel) return;
    channel.send({ embeds: [nowPlayingEmbed(track)] }).catch(() => {});
  });

  player.events.on('playerSkip', (queue, track, reason, description) => {
    logger.warn(
      `Skipped "${track?.title}" in ${queue.guild.id}: ${truncate(reason, 100)}${description ? ` — ${truncate(description, 300)}` : ''}`
    );
  });

  player.events.on('emptyQueue', (queue) => {
    const channel = queue.metadata?.channel;
    if (!channel) return;
    channel.send({ embeds: [embeds.info('The queue has finished.')] }).catch(() => {});
  });

  player.events.on('emptyChannel', (queue) => {
    const channel = queue.metadata?.channel;
    if (!channel) return;
    channel.send({ embeds: [embeds.info('Everyone left the voice channel, stopping playback.')] }).catch(() => {});
  });

  // NOTE: discord-player emits playerError as (queue, error, track).
  player.events.on('playerError', (queue, error, track) => {
    const reason = truncate(error?.message || error);
    logger.error(`Playback error for "${track?.title}" in ${queue.guild.id}: ${reason}`);

    const channel = queue.metadata?.channel;
    if (!channel) return;
    channel
      .send({
        embeds: [
          embeds.error(
            `Could not play **${truncate(track?.title, 120)}**.\n` +
              `Reason: \`${reason}\`\n` +
              'If this mentions ffmpeg or a missing binary, install ffmpeg on the host (or reinstall dependencies).'
          )
        ]
      })
      .catch(() => {});
  });

  player.events.on('error', (queue, error) => {
    logger.error(`Player error in ${queue?.guild?.id || 'unknown'}: ${truncate(error?.message || error)}`);
  });

  player.events.on('disconnect', (queue) => {
    logger.warn(`Disconnected from voice in ${queue?.guild?.id || 'unknown'}.`);
  });

  if (debugEnabled) {
    player.events.on('debug', (queue, message) => {
      logger.debug(`[player:${queue?.guild?.id || 'unknown'}] ${message}`);
    });
  }
};
