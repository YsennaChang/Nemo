//link with commands.js (reminder.js)


const { ButtonBuilder, ButtonStyle, ActionRowBuilder} = require("discord.js");
const {kv} = require("../utils/kv");
const {bot} = require("../utils/variables");

const key = "reminder";


module.exports = {
    name : "cancel",
    async execute(interaction){
        const embedReacted = interaction.message;
        let reminderID = "";        
        if (embedReacted.embeds[0].data.footer.text.startsWith('reminderID :')){
        reminderID = embedReacted.embeds[0].data.footer.text.replace(/\D/g, '');
        }

        await interaction.message.fetch(embedReacted.id)
        .then( message => {
        message.edit({
           embeds : [embedReacted.embeds[0].data],
           components : [
              new ActionRowBuilder()
              .addComponents(
                    new ButtonBuilder()
                    .setCustomId("repeat")
                    .setLabel("Repeat")
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(true)
              )
              .addComponents(
                new ButtonBuilder()
                .setCustomId("cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true)
              )]
           })
        })

        await interaction.reply({
            embeds : [{
                type : "rich",
                title : "Reminder cancelled !",
                description : `Got it <@!${interaction.user.id}>! Your reminder has been successfully cancelled!
                To reuse my 🐔 services, re-enter a command on the server where you entered my first command 🤓`,
                color : bot.color,
                footer : {
                    text : embedReacted.embeds[0].data.footer.text,
                    icon_url : embedReacted.embeds[0].data.footer.icon_url
                }
            }]
        })
        const reminder = kv.getKey(key);
        delete reminder[reminderID];
        kv.setKey(key,reminder);
    }
}

