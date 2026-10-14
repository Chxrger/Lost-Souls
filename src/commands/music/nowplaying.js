const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { getQueue } = require('../../utils/music');

module.exports = {
  data: new SlashCommandBuilder().setName('nowplaying').setDescription('Show the currently playing track.'),

  async execute(interaction, client) {
    const queue = getQueue(client, interaction);
    const track = queue?.currentTrack;
    if (!track) {
      return interaction.reply({ embeds: [embeds.error('Nothing is playing right now.')], flags: MessageFlags.Ephemeral });
    }

    const embed = new EmbedBuilder()
      .setColor(embeds.COLORS.music)
      .setTitle('Now Playing')
      .setDescription(`**[${track.title}](${track.url})**\nby **${track.author}**`)
      .addFields(
        { name: 'Duration', value: String(track.duration || 'LIVE'), inline: true },
        { name: 'Requested by', value: track.requestedBy ? `${track.requestedBy}` : 'Unknown', inline: true }
      );

    if (track.thumbnail) embed.setThumbnail(track.thumbnail);
    return interaction.reply({ embeds: [embed] });
  }
};
