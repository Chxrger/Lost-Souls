const { SlashCommandBuilder } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder().setName('ping').setDescription('Check the bot latency.'),

  async execute(interaction, client) {
    const sent = await interaction.reply({ embeds: [embeds.info('Pinging...')], fetchReply: true });
    const roundTrip = sent.createdTimestamp - interaction.createdTimestamp;
    const ws = Math.round(client.ws.ping);

    return interaction.editReply({
      embeds: [
        embeds
          .success()
          .setTitle('Pong!')
          .addFields(
            { name: 'WebSocket', value: `${ws}ms`, inline: true },
            { name: 'Round trip', value: `${roundTrip}ms`, inline: true }
          )
      ]
    });
  }
};
