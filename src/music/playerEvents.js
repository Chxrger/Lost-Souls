const { EmbedBuilder } = require('discord.js');
const embeds = require('../utils/embeds');
const logger = require('../utils/logger');

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
  player.events.on('playerStart', (queue, track) => {
    const channel = queue.metadata?.channel;
    if (!channel) return;
    channel.send({ embeds: [nowPlayingEmbed(track)] }).catch(() => {});
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

  player.events.on('playerError', (queue, track, error) => {
    logger.error(`Playback error for "${track?.title}" in ${queue.guild.id}: ${error?.message || error}`);
  });

  player.events.on('error', (queue, error) => {
    logger.error(`Player error in ${queue?.guild?.id || 'unknown'}: ${error?.message || error}`);
  });

  player.events.on('debug', () => {
    // Uncomment the line below if you need verbose player diagnostics.
    // logger.debug(args);
  });
};
