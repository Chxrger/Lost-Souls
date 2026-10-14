const { Events } = require('discord.js');
const { stores } = require('../utils/store');
const embeds = require('../utils/embeds');
const logger = require('../utils/logger');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(client, member) {
    const config = stores.config.get();

    const roleIds = member.user.bot
      ? config.autorole?.bots || []
      : config.autorole?.humans || [];

    for (const roleId of roleIds) {
      const role = member.guild.roles.cache.get(roleId);
      if (!role) continue;
      try {
        await member.roles.add(role, 'Autorole on join');
      } catch (err) {
        logger.warn(`Could not add autorole ${roleId} to ${member.id}: ${err.message}`);
      }
    }

    if (config.welcomeChannelId) {
      const channel = member.guild.channels.cache.get(config.welcomeChannelId);
      if (channel?.isTextBased()) {
        const embed = embeds.success(
          `Welcome ${member}!\nYou are member **#${member.guild.memberCount}** of **${member.guild.name}**.`
        );
        await channel.send({ content: `${member}`, embeds: [embed] }).catch(() => {});
      }
    }
  }
};
