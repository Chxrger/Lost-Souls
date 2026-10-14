const { SlashCommandBuilder, PermissionsBitField, MessageFlags } = require('discord.js');
const { QueryType } = require('discord-player');
const embeds = require('../../utils/embeds');
const { stores } = require('../../utils/store');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a song from YouTube, SoundCloud, Spotify or a direct URL.')
    .addStringOption((option) =>
      option.setName('query').setDescription('Song name or URL').setRequired(true)
    ),

  async execute(interaction, client) {
    const voiceChannel = interaction.member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({ embeds: [embeds.error('Join a voice channel first.')], flags: MessageFlags.Ephemeral });
    }

    const me = interaction.guild.members.me;
    if (me.voice.channel && me.voice.channel.id !== voiceChannel.id) {
      return interaction.reply({
        embeds: [embeds.error('I am already playing in a different voice channel.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const permissions = voiceChannel.permissionsFor(me);
    if (
      !permissions?.has(PermissionsBitField.Flags.Connect) ||
      !permissions?.has(PermissionsBitField.Flags.Speak)
    ) {
      return interaction.reply({
        embeds: [embeds.error('I need **Connect** and **Speak** permissions in your voice channel.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const query = interaction.options.getString('query', true);
    await interaction.deferReply();

    const music = stores.config.get().music || {};
    const isUrl = /^https?:\/\//i.test(query);

    try {
      const { track } = await client.player.play(voiceChannel, query, {
        searchEngine: isUrl ? undefined : QueryType.YOUTUBE_SEARCH,
        nodeOptions: {
          metadata: { channel: interaction.channel },
          volume: music.defaultVolume ?? 80,
          selfDeaf: true,
          leaveOnEmpty: music.leaveOnEmpty ?? true,
          leaveOnEmptyCooldown: music.leaveOnEmptyCooldownMs ?? 300000,
          leaveOnEnd: music.leaveOnEnd ?? true,
          leaveOnEndCooldown: music.leaveOnEndCooldownMs ?? 300000
        }
      });

      return interaction.editReply({
        embeds: [embeds.success(`Added **${track.title}** to the queue.`)]
      });
    } catch (err) {
      return interaction.editReply({
        embeds: [embeds.error(`Could not play that: ${err.message}`)]
      });
    }
  }
};
