const { SlashCommandBuilder, PermissionsBitField, ChannelType, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Send a message through the bot.')
    .setDMPermission(false)
    .addChannelOption((option) =>
      option
        .setName('channel')
        .setDescription('Channel to send the message to')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
    )
    .addStringOption((option) =>
      option.setName('message').setDescription('The message to send').setRequired(true).setMaxLength(2000)
    )
    .addBooleanOption((option) => option.setName('embed').setDescription('Send it as an embed instead of plain text')),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel', true);
    const message = interaction.options.getString('message', true);
    const asEmbed = interaction.options.getBoolean('embed') ?? false;

    const permissions = channel.permissionsFor(interaction.guild.members.me);
    if (!permissions?.has(PermissionsBitField.Flags.SendMessages)) {
      return interaction.reply({
        embeds: [embeds.error(`I can't send messages in ${channel}. Check my permissions there.`)],
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      await channel.send(asEmbed ? { embeds: [embeds.info(message)] } : { content: message });
      return interaction.editReply({ embeds: [embeds.success(`Message sent to ${channel}.`)] });
    } catch (err) {
      return interaction.editReply({ embeds: [embeds.error(`Could not send the message: ${err.message}`)] });
    }
  }
};
