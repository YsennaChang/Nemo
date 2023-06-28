const fs = require('node:fs');
const path = require('node:path');
const {Client, Collection, GatewayIntentBits, Partials} = require('discord.js');
require ("dotenv").config();

const client = new Client({
   intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.DirectMessages
   ],
   partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

//======> Declare all function files <======//

// add commands collection
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the  key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}


//======> Declare all event <======//

client.on('ready', async c => {

   console.log(`nemo.js is Ready! Logged in as ${c.user.tag}`);

});

client.on('interactionCreate', async interaction => {
   
   if (interaction.isCommand()) {
      const command = interaction.commandName;
      const user = interaction.user;
      const options = interaction.options.data.map(option => ({
        name: option.name,
        value: option.value
      }));
  
      console.log(`Command '${command}' used by ${user.username}#${user.discriminator} with options:`, options);
   }
   if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
         console.error(`No command matching ${interaction.commandName} was found.`);
         return;
      }
      try {
         await command.execute(interaction);
      } catch (error) {
         console.error(error);
         await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
      }
   } else if (interaction.isAutocomplete()) {
      const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}

		try {
			await command.autocomplete(interaction);
		} catch (error) {
			console.error(error);
		}
   }
});

// connecter le script au bot discord
client.login(process.env.TOKEN);