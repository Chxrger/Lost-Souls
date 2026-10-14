const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { getQueue, toArray } = require('../../utils/music');

module.exports = {
  data: new SlashCommandBuilder().setName('queue').setDescription('Show the current music queue.'),

  async execute(interaction, client) {
    const queue = getQueue(client, interaction);
    if (!queue || (!queue.currentTrack && toArray(queue.tracks).length === 0)) {
      return interaction.reply({ embeds: [embeds.error('The queue is empty.')], flags: MessageFlags.Ephemeral });
    }

    const tracks = toArray(queue.tracks);
    const upcoming = tracks
      .slice(0, 10)
      .map((track, index) => `**${index + 1}.** [${track.title}](${track.url}) — \`${track.duration || 'LIVE'}\``)
      .join('\n');

    const embed = new EmbedBuilder().setColor(embeds.COLORS.music).setTitle('Music Queue');

    if (queue.currentTrack) {
      embed.addFields({
        name: 'Now Playing',
        value: `[${queue.currentTrack.title}](${queue.currentTrack.url}) — \`${queue.currentTrack.duration || 'LIVE'}\``
      });
    }

    embed.addFields({
      name: `Up Next (${tracks.length})`,
      value: upcoming || 'Nothing queued.'
    });

    return interaction.reply({ embeds: [embed] });
  }
};
