const { PermissionsBitField } = require('discord.js');

const MOD_FLAGS = [
  PermissionsBitField.Flags.Administrator,
  PermissionsBitField.Flags.ManageGuild,
  PermissionsBitField.Flags.ModerateMembers,
  PermissionsBitField.Flags.KickMembers,
  PermissionsBitField.Flags.BanMembers,
  PermissionsBitField.Flags.ManageMessages
];

function isModerator(member) {
  if (!member || !member.permissions) return false;
  return MOD_FLAGS.some((flag) => member.permissions.has(flag));
}

function isWhitelisted(member, automod) {
  if (!member) return false;
  if (isModerator(member)) return true;
  const roles = automod?.ignoreRoles || [];
  return member.roles?.cache?.some((role) => roles.includes(role.id)) ?? false;
}

module.exports = {
  MOD_FLAGS,
  isModerator,
  isWhitelisted
};
