const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { stores } = require('../../utils/store');

const TYPES = [
  { name: 'Humans (new members)', value: 'humans' },
  { name: 'Bots', value: 'bots' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autorole')
    .setDescription('Manage roles given automatically to new members.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false)
    .addSubcommand((sub) =>
      sub
        .setName('add')
        .setDescription('Add an autorole')
        .addStringOption((option) => option.setName('type').setDescription('Who receives it').setRequired(true).addChoices(...TYPES))
        .addRoleOption((option) => option.setName('role').setDescription('Role').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove')
        .setDescription('Remove an autorole')
        .addStringOption((option) => option.setName('type').setDescription('Who receives it').setRequired(true).addChoices(...TYPES))
        .addRoleOption((option) => option.setName('role').setDescription('Role').setRequired(true))
    )
    .addSubcommand((sub) => sub.setName('list').setDescription('List the configured autoroles')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    if (sub === 'list') {
      const { autorole } = stores.config.get();
      const format = (ids) =>
        (ids || []).map((id) => guild.roles.cache.get(id)?.toString() || `\`${id}\` (missing)`).join(', ') || 'None';

      return interaction.reply({
        embeds: [
          embeds
            .info()
            .setTitle('Autoroles')
            .addFields(
              { name: 'Humans', value: format(autorole.humans) },
              { name: 'Bots', value: format(autorole.bots) }
            )
        ],
        flags: MessageFlags.Ephemeral
      });
    }

    const type = interaction.options.getString('type', true);
    const role = interaction.options.getRole('role', true);

    if (sub === 'add') {
      stores.config.update((config) => {
        config.autorole[type] = config.autorole[type] || [];
        if (!config.autorole[type].includes(role.id)) config.autorole[type].push(role.id);
      });
      return interaction.reply({ embeds: [embeds.success(`Added ${role} to the **${type}** autoroles.`)] });
    }

    stores.config.update((config) => {
      config.autorole[type] = (config.autorole[type] || []).filter((id) => id !== role.id);
    });
    return interaction.reply({ embeds: [embeds.success(`Removed ${role} from the **${type}** autoroles.`)] });
  }
};
