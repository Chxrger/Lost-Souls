const { Events, MessageFlags } = require('discord.js');
const embeds = require('../utils/embeds');
const logger = require('../utils/logger');
const { stores } = require('../utils/store');
const { canUse, getRequiredTier, TIER_LABELS } = require('../utils/access');

module.exports = {
  name: Events.InteractionCreate,
  async execute(client, interaction) {
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (command?.autocomplete) {
        try {
          await command.autocomplete(interaction);
        } catch (err) {
          logger.error(`Autocomplete error for /${interaction.commandName}:`, err.message);
        }
      }
      return;
    }

    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) {
      logger.warn(`No command found for /${interaction.commandName}.`);
      return;
    }

    if (interaction.guild && interaction.member) {
      let allowed = true;
      try {
        allowed = canUse(interaction.member, command, stores.config.get());
      } catch (err) {
        logger.error(`Permission check failed for /${interaction.commandName}:`, err.message);
      }

      if (!allowed) {
        const required = TIER_LABELS[getRequiredTier(command, stores.config.get())] || 'higher';
        return interaction.reply({
          embeds: [embeds.error(`You need the **${required}** tier to use this command.`)],
          flags: MessageFlags.Ephemeral
        });
      }
    }

    const player = client.player;
    const run = () => command.execute(interaction, client);

    try {
      if (player?.context?.provide && interaction.guild) {
        await player.context.provide({ guild: interaction.guild }, run);
      } else {
        await run();
      }
    } catch (err) {
      logger.error(`Error while running /${interaction.commandName}:`, err);

      const payload = {
        embeds: [embeds.error('Something went wrong while running that command.')],
        flags: MessageFlags.Ephemeral
      };

      try {
        if (interaction.deferred) await interaction.editReply({ embeds: payload.embeds });
        else if (interaction.replied) await interaction.followUp(payload);
        else await interaction.reply(payload);
      } catch (replyErr) {
        logger.error('Failed to send error response:', replyErr.message);
      }
    }
  }
};
