// link with reminder.js

const { ButtonBuilder, ButtonStyle, ActionRowBuilder} = require("discord.js");
const { cache } = require("../functions/cache");
const { botColor } = require("../utils/variables");

const key = "reminder";

const sleep = async (temps) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, temps*1000 || 0);
    });
 }; // milliseconde

module.exports = {
    name : "repeat",
    async execute(interaction){
      const embedReacted = interaction.message;
      let reminderID = "";      
      if (embedReacted.embeds[0].data.footer.text.startsWith('reminderID :')){
        reminderID = embedReacted.embeds[0].data.footer.text.replace(/\D/g, '');
      }
      const reminderData = cache.get(key);
      
      interaction.message
      .fetch(embedReacted.id)
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
            title : "Reminder restarted !",
            description : `No problem <@!${interaction.user.id}>! I'll remind you that <t:${Math.floor(Date.now()/1000) + reminderData[reminderID].temps}:R>\n> ${reminderData[reminderID].msg}`,
            color : botColor,
            footer : {
               text : embedReacted.embeds[0].data.footer.text,
               icon_url : embedReacted.embeds[0].data.footer.icon_url
            }
         }],
         ephemeral : false,
      });
      
      await sleep(reminderData[reminderID].temps)
      .then(() => {
         interaction.user.send({
            embeds : [{
               type : "rich",
               title : "Your reminder",
               description : `\n> ${reminderData[reminderID].msg}`,
               color : botColor,
               footer : {
               text : interaction.message.embeds[0].data.footer.text,
               icon_url : interaction.message.embeds[0].data.footer.icon_url
               }
            }],
            components : [
            new ActionRowBuilder()
            .addComponents(
               new ButtonBuilder()
               .setCustomId("repeat")
               .setLabel("Repeat")
               .setStyle(ButtonStyle.Primary)
            )
            .addComponents(
               new ButtonBuilder()
               .setCustomId("cancel")
               .setLabel("Cancel")
               .setStyle(ButtonStyle.Secondary)
            )]
         })
      })
   }
}