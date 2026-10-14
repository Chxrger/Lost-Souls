const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const embeds = require('../../utils/embeds');
const { stores } = require('../../utils/store');
const {
  TIER_ORDER,
  TIER_LABELS,
  COMMAND_TIERS,
  CATEGORY_TIERS,
  getPermissionsConfig,
  getRequiredTier
} = require('../../utils/access');

const ASSIGNABLE_TIERS = [
  { name: 'Admin', value: 'admin' },
  { name: 'Moderator', value: 'moderator' }
];

const COMMAND_TIER_CHOICES = [
  { name: 'Member (everyone)', value: 'member' },
  { name: 'Moderator', value: 'moderator' },
  { name: 'Admin', value: 'admin' }
];

function formatRoles(guild, ids) {
  if (!ids || ids.length === 0) return 'None';
  return ids.map((id) => guild.roles.cache.get(id)?.toString() || `\`${id}\` (missing)`).join(', ');
}

function commandNames(client) {
  return [...client.commands.keys()];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('permissions')
    .setDescription('Configure which roles can use which commands.')
    .setDMPermission(false)
    .addSubcommand((sub) => sub.setName('view').setDescription('Show the current role and command permissions'))
    .addSubcommand((sub) =>
      sub
        .setName('add-role')
        .setDescription('Grant a role a permission tier')
        .addStringOption((option) => option.setName('tier').setDescription('Permission tier').setRequired(true).addChoices(...ASSIGNABLE_TIERS))
        .addRoleOption((option) => option.setName('role').setDescription('Role to grant').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('remove-role')
        .setDescription('Revoke a role from a permission tier')
        .addStringOption((option) => option.setName('tier').setDescription('Permission tier').setRequired(true).addChoices(...ASSIGNABLE_TIERS))
        .addRoleOption((option) => option.setName('role').setDescription('Role to revoke').setRequired(true))
    )
    .addSubcommand((sub) =>
      sub
        .setName('set-command')
        .setDescription('Set the minimum tier required to use a command')
        .addStringOption((option) => option.setName('command').setDescription('Command name').setRequired(true).setAutocomplete(true))
        .addStringOption((option) => option.setName('tier').setDescription('Minimum tier').setRequired(true).addChoices(...COMMAND_TIER_CHOICES))
    )
    .addSubcommand((sub) =>
      sub
        .setName('reset-command')
        .setDescription('Reset a command back to its default tier')
        .addStringOption((option) => option.setName('command').setDescription('Command name').setRequired(true).setAutocomplete(true))
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const choices = commandNames(interaction.client)
      .filter((name) => name !== 'permissions')
      .filter((name) => name.includes(focused))
      .slice(0, 25)
      .map((name) => ({ name, value: name }));
    await interaction.respond(choices);
  },

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const guild = interaction.guild;

    if (sub === 'view') {
      const config = stores.config.get();
      const { adminRoles, moderatorRoles, commandTiers } = getPermissionsConfig(config);

      const overrides = Object.entries(commandTiers)
        .map(([name, tier]) => `\`${name}\` → **${TIER_LABELS[tier] || tier}**`)
        .join('\n') || 'None';

      const tiersByCommand = commandNames(interaction.client)
        .filter((name) => name !== 'permissions')
        .map((name) => {
          const command = interaction.client.commands.get(name);
          const tier = getRequiredTier(command, config);
          return `\`${name}\` → **${TIER_LABELS[tier]}**`;
        })
        .join('\n');

      return interaction.reply({
        embeds: [
          embeds
            .info()
            .setTitle('Permissions')
            .addFields(
              { name: 'Admin roles', value: formatRoles(guild, adminRoles) },
              { name: 'Moderator roles', value: formatRoles(guild, moderatorRoles) },
              { name: 'Command overrides', value: overrides },
              { name: 'Effective command tiers', value: tiersByCommand.slice(0, 1024) }
            )
        ],
        flags: MessageFlags.Ephemeral
      });
    }

    const tier = interaction.options.getString('tier', true);

    if (sub === 'add-role' || sub === 'remove-role') {
      const role = interaction.options.getRole('role', true);
      const key = tier === 'admin' ? 'adminRoles' : 'moderatorRoles';
      let changed = false;

      stores.config.update((config) => {
        config.permissions = config.permissions || { adminRoles: [], moderatorRoles: [], commandTiers: {} };
        const list = Array.isArray(config.permissions[key]) ? config.permissions[key] : [];
        if (sub === 'add-role') {
          if (!list.includes(role.id)) {
            list.push(role.id);
            changed = true;
          }
        } else {
          const next = list.filter((id) => id !== role.id);
          changed = next.length !== list.length;
          config.permissions[key] = next;
          return;
        }
        config.permissions[key] = list;
      });

      if (!changed) {
        return interaction.reply({ embeds: [embeds.warn(`${role} is already ${sub === 'add-role' ? 'in' : 'not in'} the **${TIER_LABELS[tier]}** tier.`)], flags: MessageFlags.Ephemeral });
      }

      return interaction.reply({ embeds: [embeds.success(`${sub === 'add-role' ? 'Added' : 'Removed'} ${role} ${sub === 'add-role' ? 'to' : 'from'} the **${TIER_LABELS[tier]}** tier.`)] });
    }

    const name = interaction.options.getString('command', true).toLowerCase();
    const known = commandNames(interaction.client);
    if (!known.includes(name)) {
      return interaction.reply({ embeds: [embeds.error(`Unknown command \`${name}\`.`)], flags: MessageFlags.Ephemeral });
    }

    if (sub === 'set-command') {
      stores.config.update((config) => {
        config.permissions = config.permissions || { adminRoles: [], moderatorRoles: [], commandTiers: {} };
        config.permissions.commandTiers = config.permissions.commandTiers || {};
        config.permissions.commandTiers[name] = tier;
      });
      return interaction.reply({ embeds: [embeds.success(`\`${name}\` now requires the **${TIER_LABELS[tier]}** tier.`)] });
    }

    const command = interaction.client.commands.get(name);
    const fallback = getRequiredTier(command, { permissions: { commandTiers: {} } });
    stores.config.update((config) => {
      if (config.permissions?.commandTiers) delete config.permissions.commandTiers[name];
    });
    return interaction.reply({ embeds: [embeds.success(`\`${name}\` reset to its default tier (**${TIER_LABELS[fallback]}**).`)] });
  }
};
