const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
var config = require('./config.json')

const commands = [{
  name: 'kick-them-all',
  description: 'Will kick all users from the server that are younger than 1 week old.',
  permissions: [{
      id: config.allowedRoleId,
      type: 'ROLE',
      permission: true
    }]
}]; 

const rest = new REST({ version: '9' }).setToken(config.token);

(async () => {
  try {
    console.log('Started refreshing application (/) commands.');

    await rest.put(
      Routes.applicationGuildCommands(config.clientId, config.serverId),
      { body: commands },
    );

    console.log('Successfully reloaded application (/) commands.');
  } catch (error) {
    console.error(error);
  }
})();