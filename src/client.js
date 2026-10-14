const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

function createClient() {
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildVoiceStates
    ],
    partials: [
      Partials.Channel,
      Partials.Message,
      Partials.Reaction,
      Partials.GuildMember,
      Partials.User
    ]
  });

  client.commands = new Collection();
  client.player = null;
  return client;
}

module.exports = { createClient };
