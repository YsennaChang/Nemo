const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandIntegerOption, SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle} = require("discord.js");
const { cache } = require("../functions/cache");
const { botColor } = require("../utils/variables");
const { devFooter } = require("../messages/footers");
const { filterObj } = require("../functions/filterObj");

const emojiID = "https://cdn.discordapp.com/attachments/1029687555865714719/1072841191181266964/black-indesign-logo-icon-20.png";

// program to display a text using setTimeout method
const key = "reminder";

const sleep = async (user, temps, msg, channel, deadline) => {
    
    const reminderData = cache.get(key)

    let reminder = {}
    if( reminderData ){
        reminder = reminderData;
    }
    return new Promise((resolve) => {
        const reminderID = setTimeout(() => {
            resolve(reminderID);
        }, temps*1000 || 0);//en ms
        reminder[reminderID] = {
            user, temps, msg, channel, deadline, reminderID
        };
        cache.set(key, reminder);
    });
}; // milliseconde

module.exports = {

    data : new SlashCommandBuilder()
        .setName("reminder")
        .setDescription("Schedule a reminder")
        // .addSubcommand(
        //     new SlashCommandSubcommandBuilder()
        //     .setName("personal")
        //     .setDescription("Schedule a personal reminder (by direct message)")
        //     .addStringOption(
        //         new SlashCommandStringOption()
        //         .setName("message")
        //         .setDescription(`What is the message you want to remind ?`)
        //         .setRequired(true)
        //     )
        //     .addBooleanOption(
        //         new SlashCommandBooleanOption()
        //         .setName("repeat")
        //         .setDescription("Is this a recurring reminder ?")
        //         .setRequired(true)
        //     )
        //     .addIntegerOption(
        //         new SlashCommandIntegerOption()
        //         .setName("hours")
        //         .setDescription(`In how many hours ?`)
        //         .setRequired(true)
        //     )
        //     .addIntegerOption(
        //         new SlashCommandIntegerOption()
        //         .setName("minutes")
        //         .setDescription(`and how many minutes ?`)
        //         .setRequired(true)
        //     )
        //     .addIntegerOption(
        //         new SlashCommandIntegerOption()
        //         .setName("seconds")
        //         .setDescription(`how many seconds ?`)
        //         .setRequired(false)
        //     )
        // )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("group")
            .setDescription("Schedule a group reminder")
            .addStringOption(
                new SlashCommandStringOption()
                .setName("message")
                .setDescription(`What is the message you want to remind ? ?`)
                .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                .setName("ping")
                .setDescription("Who are the people to ping? Use @ to see the list of mentionables ")
                .setRequired(true)
            )
            .addIntegerOption(
                new SlashCommandIntegerOption()
                .setName("hours")
                .setDescription(`In how many hours ?`)
                .setRequired(true)
            )
            .addIntegerOption(
                new SlashCommandIntegerOption()
                .setName("minutes")
                .setDescription(`how many minutes ?`)
                .setRequired(true)
            )
            .addIntegerOption(
                new SlashCommandIntegerOption()
                .setName("seconds")
                .setDescription(`how many seconds ?`)
                .setRequired(false)
            )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("bunny")
            .setDescription("Schedule a reminder for a bunny derby")
            .addIntegerOption(
                new SlashCommandIntegerOption()
                .setName("days")
                .setDescription(`In how many days is announced your bunny ?`)
                .setMaxValue(3)
                .setRequired(true)
            )
            .addIntegerOption(
                new SlashCommandIntegerOption()
                .setName("hours")
                .setDescription(`In how many hours is announced your bunny ?`)
                .setMaxValue(23)
                .setRequired(true)
            )
            .addIntegerOption(
                new SlashCommandIntegerOption()
                .setName("minutes")
                .setDescription(`In how many minutes is announced your bunny ?`)
                .setMaxValue(59)
                .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                .setName("ping")
                .setDescription(`Do we need to ping someone? Use @ to see the list of mentionables`)
                .setRequired(false)
            )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("list")
            .setDescription("List your current reminders on this server")
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("delete")
            .setDescription("Delete a reminder")
            .addStringOption(
                new SlashCommandStringOption()
                .setName("reminders")
                .setDescription("Your ongoing reminders")
                .setRequired(true)
                .setAutocomplete(true)
            )
        ),
    async autocomplete(interaction) {
        const userreminders = filterObj(cache.get(key),interaction.user.id, "user");
        const filteredArray = [];
        for (const reminderID in userreminders) {
            let userTimer = {name : `${userreminders[reminderID].msg}`, value : reminderID }
            filteredArray.push(userTimer);
        }
		await interaction.respond(filteredArray);
    },

    async execute(interaction){

        const reminderType = interaction.options.data[0].name;
        if (reminderType ==="personal"){
            const message = interaction.options.data[0].options[0].value;
            const heures = interaction.options.data[0].options[1].value;
            const minutes = interaction.options.data[0].options[2].value;
            let secondes = 0;
            if ( interaction.options.data[0].options[3] ){
                secondes = interaction.options.data[0].options[4].value;// en secondes
            }
            let row = {};
            let temps = heures*60*60 + minutes*60 + secondes;// en secondes
            let deadline = Math.floor(Date.now()/1000) + temps ; // en secondes

            if (interaction.options.data[0].options[1].value) {
                row = new ActionRowBuilder()
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
                );
            }

            await interaction.reply({
                embeds : [{
                    type : "rich",
                    title : "Reminder created !",
                    description : `No soucy <@!${interaction.user.id}>! I'll remind you that <t:${deadline}:R>\n> ${message}`,
                    color : botColor,
                    footer : {
                        text : devFooter,
                        icon_url : interaction.guild.iconURL()
                    }
                }],
                ephemeral : true,
            });

            if(repeat){
                await sleep(interaction.user, temps, message, interaction.channel, deadline)
                .then( reminderID => {
                    interaction.user.send({
                        embeds : [{
                            type : "rich",
                            title : "Your reminder",
                            description : `\n> ${message}`,
                            color : botColor,
                            footer : {
                                text : 'reminderID : ' + reminderID,
                                icon_url : emojiID
                            }
                        }],
                        components : [row]
                    })
                });
            } else if (!repeat){
                await sleep(interaction.user,temps, message, interaction.channel, deadline)
                .then( reminderID => {
                    interaction.user.send({
                        embeds : [{
                            type : "rich",
                            title : "Your reminder",
                            description : `\n> ${message}`,
                            color : botColor,
                            footer : {
                                text : 'reminderID : ' + reminderID,
                                icon_url : emojiID
                            }
                        }]
                    })
                    clearTimeout(reminderID);
                    const reminder = cache.get(key);
                    delete reminder[reminderID];
                   cache.set(key, reminder);
                });
            }
        }
        if(interaction.options.data[0].name==="group"){
            const message = interaction.options.data[0].options[0].value;
            const ping = interaction.options.data[0].options[1].value;
            const heures = interaction.options.data[0].options[2].value;
            const minutes = interaction.options.data[0].options[3].value;
            
            let secondes = 0;
            if ( interaction.options.data[0].options[4] ){
                secondes = interaction.options.data[0].options[4].value;// en secondes
            }

            let temps = heures*60*60 + minutes*60 + secondes;// en secondes
            let deadline = Math.floor(Date.now()/1000) + temps; // en secondes

            await interaction.reply({
                embeds : [{
                    type : "rich",
                    title : "Reminder created !",
                    description : `<@!${interaction.user.id}> programmed a reminder for ${ping} <t:${deadline}:R>, which is <t:${deadline}:F> :\n> ${message}`,
                    color : botColor,
                    footer : {
                        text : devFooter,
                        icon_url : interaction.guild.iconURL()
                    }
                }],
                ephemeral : false,
            });

            await sleep(interaction.user, temps, message, interaction.channel, deadline).then( reminderID => {
                interaction.channel.send({
                    content : ping,
                    embeds : [{
                        type : "rich",
                        title : "",
                        description : `<@!${interaction.user.id}> wants to remind you of this :\n> ${message}`,
                        color : botColor,
                        footer : {
                            text : devFooter,
                            icon_url : interaction.guild.iconURL()
                        }
                    }]
                })
                clearTimeout(reminderID);
                const reminder = cache.get(key);
                delete reminder[reminderID];
                cache.set(key, reminder);
            });
        }
        if( reminderType === "bunny"){
            const jours = interaction.options.data[0].options[0].value;
            const heures = interaction.options.data[0].options[1].value;
            const minutes = interaction.options.data[0].options[2].value;
            let ping = `<@!${interaction.user.id}>`;
            if ( interaction.options.data[0].options[3] ){
                ping = `${interaction.options.data[0].options[3].value}`;
            }

            let temps = jours*24*60*60 + heures*60*60 + minutes*60;// en secondes
            const cycle = (60+30+10)*60; // en secondes
            let lapin = Math.floor(Date.now()/1000) + temps ; // en secondes
            let temps0 = temps-cycle; // en secondes 
            let lapin0 = Math.floor(Date.now()/1000) + temps0;
            let lapin0Texte = ``;
            if (temps0 > 0) {
                if (new Date(Date.now()).getDay() === 2 ){ //2 = mardi
                    lapin0Texte = `\n\n🐰🔪 If a normal task is taken before <t:${lapin0}:F>, the bunny will arrive **1h40** before the announced time, i.e. <t:${lapin0}:R>.`;
                } else {
                    lapin0Texte = `\n\n🐰🔪 The bunny will arrive in advance <t:${lapin0}:R>, i.e. <t:${lapin0}:F>.`
                }
            }
            
            let embedLapin = {
                type : "rich",
                title : "🔥🔥🔥 Bunny Time 🔥🔥🔥 ",
                description : `🐰🔪It's time to catch the Bunny ! 🐰🔪`,
                color : botColor,
                footer : {
                    text : devFooter,
                    icon_url : interaction.guild.iconURL()
                }
            }

            await interaction.reply({
                embeds : [{
                    type : "rich",
                    title : "Bunny Derby Week 🐰🔪 !",
                    description : `🐰🔪 <@!${interaction.user.id}> has scheduled the arrival of a bunny <t:${lapin}:R>, i.e. <t:${lapin}:F>.${lapin0Texte}\n\nA Ping will be sent to ${ping} at that time.`,
                    color : botColor,
                    footer : {
                        text : devFooter,
                        icon_url : interaction.guild.iconURL()
                    }
                }],
                ephemeral : false
            });
            if (temps0 > 0) {
                let message = "Anticipated bunny";
                await sleep(interaction.user, temps0, message, interaction.channel, lapin0).then( reminderID => {
                    interaction.channel.send({
                        content : ping,
                        embeds : [embedLapin]
                    })
                    clearTimeout(reminderID);
                    const reminder = cache.get(key);
                    delete reminder[reminderID];
                    cache.set(key, reminder);
                });
                temps = cycle;
            }
            let message = "bunny";
           await sleep(interaction.user, temps, message, interaction.channel, lapin).then( reminderID => {
                interaction.channel.send({
                    content : ping,
                    embeds : [embedLapin]
                })
                clearTimeout(reminderID);
                    const reminder = cache.get(key);
                    delete reminder[reminderID];
                    cache.set(key, reminder);
            });
        }
        if( reminderType === "list"){
            const userID = interaction.user.id;

            const userTimers = filterObj(cache.get(key), userID, "user");
            let timersText = ``;
            if (Object.keys(userTimers).length > 0){
                for (const timer in userTimers) {
                    timersText += `\n> <t:${userTimers[timer].deadline}:R> in ${userTimers[timer].channel} => ${userTimers[timer].msg}`
                }
            } else {
                timersText = `\n> You don't have a reminder in progress`;
            }

            await interaction.reply({
                embeds : [{
                    type :"rich",
                    description : `Here is the list of current reminders on this server : ${timersText}`,
                    color : botColor,
                    author : {
                        name : `Your reminders - ${interaction.member.nickname}`,
                        iconURL : interaction.user.avatarURL()
                    } ,
                    footer : {
                        text : devFooter,
                        icon_url : interaction.guild.iconURL()
                    }
                }],
                ephemeral : true
            })
        }
        if( reminderType === "delete"){
            const reminderID = interaction.options.data[0].options[0].value;
            const reminders = cache.get(key)
            await interaction.reply({
                embeds: [{
                    type :"rich",
                    title :"Reminder deleted",
                    description : `Your reminder : \n> ${reminders[reminderID].msg} \nscheduled <t:${reminders[reminderID].deadline}:R>, was successful deleted !`,
                    color : botColor,
                    footer : {
                        text : devFooter,
                        icon_url : interaction.guild.iconURL()
                    }
                }],
                ephemeral : true
            });
            clearTimeout(reminderID);
            const reminder = cache.get(key);
            delete reminder[reminderID];
            cache.set(key, reminder);
        }
    }
};