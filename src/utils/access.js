const { PermissionFlagsBits } = require('discord.js');

const TIERS = { member: 0, moderator: 1, admin: 2 };
const TIER_ORDER = ['member', 'moderator', 'admin'];
const TIER_LABELS = { member: 'Member', moderator: 'Moderator', admin: 'Admin' };

const COMMAND_TIERS = {
  config: 'admin',
  automod: 'admin',
  mcserver: 'admin',
  welcome: 'admin',
  permissions: 'admin',
  say: 'moderator',
  kick: 'moderator',
  ban: 'moderator',
  purge: 'moderator',
  timeout: 'moderator',
  role: 'moderator',
  autorole: 'moderator',
  reactionrole: 'moderator'
};

const CATEGORY_TIERS = {
  config: 'admin',
  moderation: 'moderator',
  roles: 'moderator',
  music: 'member',
  utility: 'member'
};

const DEFAULT_TIER = 'member';

function isValidTier(tier) {
  return Object.prototype.hasOwnProperty.call(TIERS, tier);
}

function normalizeTier(tier, fallback = DEFAULT_TIER) {
  return isValidTier(tier) ? tier : fallback;
}

function getPermissionsConfig(config) {
  const permissions = config && config.permissions;
  return {
    adminRoles: Array.isArray(permissions?.adminRoles) ? permissions.adminRoles : [],
    moderatorRoles: Array.isArray(permissions?.moderatorRoles) ? permissions.moderatorRoles : [],
    commandTiers: permissions && typeof permissions.commandTiers === 'object' && permissions.commandTiers
      ? permissions.commandTiers
      : {}
  };
}

function getRequiredTier(command, config) {
  const name = typeof command === 'string' ? command : command?.name;
  const category = typeof command === 'string' ? undefined : command?.category;
  const { commandTiers } = getPermissionsConfig(config);

  const override = commandTiers[name];
  if (isValidTier(override)) return override;
  if (COMMAND_TIERS[name]) return COMMAND_TIERS[name];
  if (category && CATEGORY_TIERS[category]) return CATEGORY_TIERS[category];
  return DEFAULT_TIER;
}

function getMemberTier(member, config) {
  if (!member) return 'admin';
  if (member.id && member.guild && member.guild.ownerId === member.id) return 'admin';
  if (member.permissions?.has?.(PermissionFlagsBits.Administrator)) return 'admin';

  const { adminRoles, moderatorRoles } = getPermissionsConfig(config);
  const roleIds = member.roles?.cache ? [...member.roles.cache.keys()] : [];

  if (roleIds.some((id) => adminRoles.includes(id))) return 'admin';
  if (roleIds.some((id) => moderatorRoles.includes(id))) return 'moderator';
  return 'member';
}

function canUse(member, command, config) {
  const required = TIERS[getRequiredTier(command, config)];
  const actual = TIERS[getMemberTier(member, config)];
  return actual >= required;
}

function getAccessSummary(config) {
  const { adminRoles, moderatorRoles, commandTiers } = getPermissionsConfig(config);
  return { adminRoles, moderatorRoles, commandTiers };
}

module.exports = {
  TIERS,
  TIER_ORDER,
  TIER_LABELS,
  COMMAND_TIERS,
  CATEGORY_TIERS,
  DEFAULT_TIER,
  isValidTier,
  normalizeTier,
  getPermissionsConfig,
  getRequiredTier,
  getMemberTier,
  canUse,
  getAccessSummary
};
