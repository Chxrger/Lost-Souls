const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const { stores } = require('../../utils/store');
const embeds = require('../../utils/embeds');

const TYPES = [
  { name: 'Java Edition', value: 'java' },
  { name: 'Bedrock Edition', value: 'bedrock' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mcserver')
    .setDescription('Manage Minecraft servers that /server can query.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add a Minecraft server')
        .addStringOption((option) => option.setName('name').setDescription('Friendly name, e.g. Survival').setRequired(true))
        .addStringOption((option) => option.setName('host').setDescription('Hostname or IP').setRequired(true))
        .addIntegerOption((option) => option.setName('port').setDescription('Port (defaults by edition)').setMinValue(1).setMaxValue(65535))
        .addStringOption((option) => option.setName('type').setDescription('Edition').addChoices(...TYPES))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove a Minecraft server')
        .addStringOption((option) => option.setName('name').setDescription('Server name').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List configured Minecraft servers')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const servers = stores.servers.get().servers;
      if (servers.length === 0) {
        return interaction.reply({ embeds: [embeds.info('No servers configured.')], flags: MessageFlags.Ephemeral });
      }
      const description = servers
        .map((server) => `**${server.name}** — \`${server.host}:${server.port || (server.type === 'bedrock' ? 19132 : 25565)}\` (${server.type})`)
        .join('\n');
      return interaction.reply({ embeds: [embeds.info().setTitle('Minecraft Servers').setDescription(description)], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'add') {
      const name = interaction.options.getString('name', true).trim();
      const host = interaction.options.getString('host', true).trim();
      const port = interaction.options.getInteger('port') || null;
      const type = interaction.options.getString('type') || 'java';

      stores.servers.update((data) => {
        data.servers = (data.servers || []).filter((server) => server.name.toLowerCase() !== name.toLowerCase());
        data.servers.push({ name, host, port, type });
      });

      return interaction.reply({ embeds: [embeds.success(`Added **${name}** (\`${host}\`, ${type}).`)], flags: MessageFlags.Ephemeral });
    }

    const name = interaction.options.getString('name', true).trim().toLowerCase();
    let removed = false;
    stores.servers.update((data) => {
      const before = data.servers.length;
      data.servers = data.servers.filter((server) => server.name.toLowerCase() !== name);
      removed = data.servers.length !== before;
    });

    if (!removed) {
      return interaction.reply({ embeds: [embeds.error('No server with that name was found.')], flags: MessageFlags.Ephemeral });
    }
    return interaction.reply({ embeds: [embeds.success(`Removed **${name}**.`)], flags: MessageFlags.Ephemeral });
  }
};
