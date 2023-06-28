const { SlashCommandBuilder, SlashCommandIntegerOption } = require("@discordjs/builders");
const { botColor } = require('../utils/variables');
const { devFooter } = require("../messages/footers.js");
const { getValues } = require("../functions/getValues") ;
const { haydayDataBaseSheetId } = require("../utils/variables");

const key = "mining";

module.exports = {

    data : new SlashCommandBuilder()
        .setName(key)
        .setDescription("Calculate if you have enough mining tools for a mining task")
        .addIntegerOption(
            new SlashCommandIntegerOption()
            .setName('target')
            .setDescription(`How much ores do you need to extract ? (The 320 point task ask for 99 ores)`)
            .setRequired(true))
        .addIntegerOption(
            new SlashCommandIntegerOption()
            .setName('dynamite')
            .setDescription('How much Dynamite do you have ?')
            .setRequired(true)
        )
        .addIntegerOption(
            new SlashCommandIntegerOption()
            .setName('tnt')
            .setDescription('How much TnT do you have ?')
            .setRequired(true)
        )
        .addIntegerOption(
            new SlashCommandIntegerOption()
            .setName('shovel')
            .setDescription('How much shovel do you have ?')
            .setRequired(true)
        )
        .addIntegerOption(
            new SlashCommandIntegerOption()
            .setName('pickaxe')
            .setDescription('How much pickaxe do you have ?')
            .setRequired(true)
        ),

    async execute(interaction){
        const taskParams = [
            {prop : "Cat", value : key}
          ];
        const taskSettings = await getValues(haydayDataBaseSheetId, "HDemojis", taskParams);

        
        const objectif = interaction.options.data[0].value;
        const dynamite = interaction.options.data[1].value;
        const tnt = interaction.options.data[2].value;
        const pelle = interaction.options.data[3].value;
        const pioche = interaction.options.data[4].value;

        
        let sum = dynamite*2 + tnt*3 + pelle*4 +pioche*5;
        let result = objectif-sum;
        let piocheR = result/5; // nombre d'outil restant à aquérir
        let piocheM = result % 5; //modulo
        let pelleR = piocheM / 4;
        let pelleM = piocheM % 4;
        let tntR = pelleM / 3;
        let tntM = pelleM % 3;
        let dynamiteR = tntM>0 ? 1 : 0;

        const dynamiteEmoji = taskSettings.find( element => element.enName === "dynamite").emoji;

        const TNTEmoji = taskSettings.find( element => element.enName === "tnt").emoji;
        const shovelEmoji = taskSettings.find( element => element.enName === "shovel").emoji;
        const pickaxeEmoji = taskSettings.find( element => element.enName === "pickaxe").emoji;

        
        let content = `__**❖ Your Settings :**__\n\n> You aim to extract **${objectif}** ores.\n> With **${dynamite}x** ${dynamiteEmoji} , **${tnt}x** ${TNTEmoji}, **${pelle}x** ${shovelEmoji}, **${pioche}x** ${pickaxeEmoji}, you can extract **${sum}** ores.\n\n__**❖ Results :**__`;
        if (result >= 0) {
        content += `\n> You will still need **${result}** ores to reach your goal.\n> Suggested tools : **${Math.floor(dynamiteR)}x** ${dynamiteEmoji}, **${Math.floor(tntR)}x** ${TNTEmoji}, **${Math.floor(pelleR)}x** ${shovelEmoji}, **${Math.floor(piocheR)}x** ${pickaxeEmoji}\n> ||***Info** : ${dynamiteEmoji}+2, ${TNTEmoji}+3, ${shovelEmoji}+4, ${pickaxeEmoji}+5*||`
        } else {
            content += `\n> You have enough tools to achieve your target.👍`
        }

        const embed = {
            type : "rich",
            title : `Do you have enough mining tools for a mining task ?`,
            description : content,
            color : botColor,
            footer : {
                text : devFooter,
                icon_url : interaction.guild.iconURL()
            }
        }

        await interaction.reply({embeds: [embed]});
    },
};