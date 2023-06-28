const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');

const rest = new REST({ version: '10' }).setToken(token);

// for guild-based commands
// rest.delete(Routes.applicationGuildCommand(clientId, "1029684147834322944", '1077284131785941013'))
// 	.then(() => console.log('Successfully deleted potes à la compote quiz command'))
// 	.catch(console.error);


rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [] })
.then(() => console.log('Successfully deleted all guild commands.'))
.catch(console.error);
