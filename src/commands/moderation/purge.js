const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { sendLog } = require('../../utils/logging');

const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Bulk delete recent messages in this channel.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false)
    .addIntegerOption((option) =>
      option.setName('amount').setDescription('How many messages (1-100)').setRequired(true).setMinValue(1).setMaxValue(100)
    )
    .addUserOption((option) => option.setName('user').setDescription('Only delete messages from this user'))
    .addStringOption((option) => option.setName('contains').setDescription('Only delete messages containing this text')),

  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const amount = interaction.options.getInteger('amount', true);
    const user = interaction.options.getUser('user');
    const contains = interaction.options.getString('contains');

    const fetched = await interaction.channel.messages.fetch({ limit: 100 });
    let messages = [...fetched.values()].filter(
      (message) => !message.pinned && Date.now() - message.createdTimestamp < TWO_WEEKS
    );

    if (user) messages = messages.filter((message) => message.author.id === user.id);
    if (contains) {
      const needle = contains.toLowerCase();
      messages = messages.filter((message) => message.content.toLowerCase().includes(needle));
    }

    messages = messages.slice(0, amount);

    if (messages.length === 0) {
      return interaction.editReply({
        embeds: [embeds.error('No matching messages found (messages older than 14 days cannot be bulk deleted).')]
      });
    }

    const deleted = await interaction.channel.bulkDelete(messages, true);

    await sendLog(
      interaction.guild,
      embeds.info(
        `${deleted.size} message(s) purged in ${interaction.channel} by ${interaction.user}.` +
          (user ? `\nFiltered by user: ${user}` : '') +
          (contains ? `\nFiltered by text: \`${contains}\`` : '')
      )
    );

    return interaction.editReply({ embeds: [embeds.success(`Deleted ${deleted.size} message(s).`)] });
  }
};
