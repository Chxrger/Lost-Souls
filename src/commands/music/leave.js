const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { getQueue } = require('../../utils/music');

module.exports = {
  data: new SlashCommandBuilder().setName('leave').setDescription('Make the bot leave the voice channel.'),

  async execute(interaction, client) {
    const queue = getQueue(client, interaction);
    if (queue) {
      queue.delete();
      return interaction.reply({ embeds: [embeds.success('Left the voice channel and cleared the queue.')] });
    }

    const me = interaction.guild.members.me;
    if (!me.voice.channel) {
      return interaction.reply({ embeds: [embeds.error('I am not in a voice channel.')], flags: MessageFlags.Ephemeral });
    }

    try {
      const connection = client.player.voiceUtils.getConnection(interaction.guild.id);
      if (connection) client.player.voiceUtils.disconnect(connection);
      return interaction.reply({ embeds: [embeds.success('Left the voice channel.')] });
    } catch (err) {
      return interaction.reply({ embeds: [embeds.error(`Could not leave: ${err.message}`)], flags: MessageFlags.Ephemeral });
    }
  }
};
