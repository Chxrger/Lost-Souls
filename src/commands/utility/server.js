const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const { status, statusBedrock } = require('minecraft-server-util');
const { stores } = require('../../utils/store');
const embeds = require('../../utils/embeds');

const JAVA_DEFAULT_PORT = 25565;
const BEDROCK_DEFAULT_PORT = 19132;

function cleanMotd(value) {
  if (!value) return 'No description';
  return String(value).replace(/§./g, '').trim() || 'No description';
}

async function query(server) {
  if (server.type === 'bedrock') {
    const result = await statusBedrock(server.host, { port: server.port || BEDROCK_DEFAULT_PORT, timeout: 5000 });
    return {
      version: result.version?.name || 'Unknown',
      online: result.players?.online ?? 0,
      max: result.players?.max ?? 0,
      sample: result.players?.sample,
      motd: cleanMotd(result.motd?.clean || result.motd?.raw || result.motd || result.motdLine1),
      latency: result.roundTripLatency
    };
  }

  const result = await status(server.host, server.port || JAVA_DEFAULT_PORT, { timeout: 5000 });
  return {
    version: result.version?.name || 'Unknown',
    online: result.players?.online ?? 0,
    max: result.players?.max ?? 0,
    sample: result.players?.sample,
    motd: cleanMotd(result.motd?.clean || result.motd?.raw || result.motd),
    latency: result.roundTripLatency
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('server')
    .setDescription('Show live status and players for a configured Minecraft server.')
    .addStringOption((option) => option.setName('name').setDescription('Which server to query').setAutocomplete(true)),

  async autocomplete(interaction) {
    const servers = stores.servers.get().servers;
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = servers
      .filter((server) => server.name.toLowerCase().includes(focused))
      .slice(0, 25)
      .map((server) => ({ name: server.name, value: server.name }));
    return interaction.respond(choices);
  },

  async execute(interaction) {
    const servers = stores.servers.get().servers;
    if (servers.length === 0) {
      return interaction.reply({
        embeds: [embeds.error('No servers are configured yet. Add one with `/mcserver add`.')],
        flags: MessageFlags.Ephemeral
      });
    }

    const name = interaction.options.getString('name');
    let server;
    if (name) {
      server = servers.find((item) => item.name.toLowerCase() === name.toLowerCase());
    } else if (servers.length === 1) {
      server = servers[0];
    }

    if (!server) {
      const list = servers.map((item) => `\`${item.name}\``).join(', ');
      return interaction.reply({
        embeds: [embeds.info(`Please pick a server: ${list}`)],
        flags: MessageFlags.Ephemeral
      });
    }

    await interaction.deferReply();

    try {
      const result = await query(server);
      const embed = new EmbedBuilder()
        .setColor(embeds.COLORS.success)
        .setTitle(`${server.name} — ${server.host}`)
        .setDescription(result.motd)
        .addFields(
          { name: 'Status', value: '🟢 Online', inline: true },
          { name: 'Players', value: `${result.online}/${result.max}`, inline: true },
          { name: 'Version', value: result.version, inline: true }
        );

      if (result.sample?.length) {
        const names = result.sample.slice(0, 15).map((player) => player.name).join(', ');
        embed.addFields({ name: `Online players (${result.sample.length})`, value: names.slice(0, 1024) });
      }

      if (result.latency) embed.setFooter({ text: `Ping: ${Math.round(result.latency)}ms • ${server.type}` });

      return interaction.editReply({ embeds: [embed] });
    } catch {
      return interaction.editReply({
        embeds: [embeds.error(`**${server.name}** appears to be offline or unreachable.`)]
      });
    }
  }
};
