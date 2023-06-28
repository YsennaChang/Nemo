const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandIntegerOption} = require("@discordjs/builders");
const { convertInHour } = require("../functions/convertInHour")
const { botColor } = require('../utils/variables.js');
const { devFooter } = require("../messages/footers.js");
const { getValues } = require("../functions/getValues");
const { haydayDataBaseSheetId } = require("../utils/variables");

const key = "harvest";

module.exports = {

  data : new SlashCommandBuilder()
  .setName(key)
  .setDescription("Calculate the time needed for a harvest task according to your level")
  .addStringOption(
    new SlashCommandStringOption()
    .setName("crops")
    .setDescription("Choose the crops that you are interest in. The number un () indicate the 320 points task goal")
    .setRequired(true)
    .setAutocomplete(true)
  )
  .addIntegerOption(
    new SlashCommandIntegerOption()
      .setName("target")
      .setDescription("Number of fields to harvest")
      .setRequired(true)
  )
  .addIntegerOption(
    new SlashCommandIntegerOption()
      .setName("level")
      .setDescription("What is your level ?")
      .setRequired(true)
  )
  .addStringOption(
    new SlashCommandStringOption()
      .setName("start_at")
      .setDescription("At what time (hh:mm) would you like to start the task ?")
      .setRequired(false)
  ),

  async autocomplete(interaction){
    if (interaction.options.data[0].name === "crops"){

      const cropsSettings = await getValues(haydayDataBaseSheetId, "crops");

      const focusedValue = interaction.options.getFocused();
      const filtered = cropsSettings.filter( object => object.enName.toLowerCase().includes(focusedValue.toLowerCase()))
      console.log(filtered)

      let options;
      if (filtered.length > 25){
        options = filtered.slice(0,25);
      } else {
        options = filtered;
      }

      await interaction.respond(
        options.map(choice => ({ name: `${choice.enName} (${choice.task320})`, value: `${choice.value}` })),
      );
    }

  },

  async execute(interaction){
    const crops = interaction.options.data[0].value;
    const objectif = interaction.options.data[1].value;
    const niveau = interaction.options.data[2].value;

    const cropsParams = [
      {prop : "value", value : crops}
    ];

    const cropsSettings = await getValues(haydayDataBaseSheetId, "crops", cropsParams);

    let debut = 0;
    if (interaction.options.data[3]){
      let heures = Number(interaction.options.data[3].value.substring(0,2));
      let minutes = Number(interaction.options.data[3].value.substring(4,5));
      debut = heures * 60 + minutes;
    }

    const champs = 6 + Math.floor((Math.min(50,niveau)-1)/2)*3 + Math.floor(Math.max(0,(Math.min(100,niveau)-49))/2)*2 + Math.floor(Math.max(0,niveau-99)/2); // Math.floor arrondi inférieur

    let frequency = objectif / champs; //fréquence de connexion

    let frequency0 = Math.ceil(frequency);// Math.ceil arrondi sup
    let borneSup0 = Math.ceil(objectif / (frequency0 - 1)); // Math.ceil arrondi sup
    let borneInf0 = Math.ceil(objectif / frequency0); // Math.floor arrondi inf Nb champ minimal pour rester dans le même temps
    let duration0 = convertInHour(frequency0 * cropsSettings[0].growthTime) ; //durée de la tâche (en minute)

    let frequency1 = frequency0 + 1;
    let borneSup1 = borneInf0 - 1;
    let borneInf1 = Math.ceil(objectif / frequency1);
    let duration1 = convertInHour(frequency1 * cropsSettings[0].growthTime) ;

    let frequency2 = frequency1 + 1;
    let borneSup2 = borneInf1 - 1;
    let borneInf2 = Math.ceil(objectif / frequency2);
    let duration2 = convertInHour(frequency2 * cropsSettings[0].growthTime) ;

    // Niveau à viser pour changer de catégorie.
    let lvl = 0;
    if(borneSup0>= 6 && borneSup0<80){
      lvl = Math.ceil(borneSup0/3*2)-3
    } else if ( borneSup0 > 80 && borneSup0 <= 129 ) {
      lvl = borneSup0 - 29;
    } else if (borneSup0 > 129) {
      lvl = borneSup0*2 - 157
    }

    if (lvl%2 == 0) {
      lvl = lvl + 1;
    }

    let frequencyS = frequency0 - 1 ;
    let durationS = convertInHour(frequencyS * cropsSettings[0].growthTime) ;

    let debutText = "";
    if (debut > 0) {
      debutText = `\n> ${cropsSettings[0].cropEmoji} Specified start time : **${convertInHour(debut)}**\n> ${cropsSettings[0].cropEmoji} Estimated end time (earliest): **${convertInHour(frequency0 * cropsSettings[0].growthTime + debut)}**`
    }

    let limit = "";
    if (objectif === cropsSettings[0].task320){
      limit = `\n> ${cropsSettings[0].cropEmoji} The time limit to do this **320** points task is **${convertInHour(cropsSettings[0].timeLimit)}**.`;
    }

    let heureLimite = ``;
    if (debut && objectif === cropsSettings[0].task320){
      heureLimite = `\n> ${cropsSettings[0].cropEmoji} La tâche expirera à **${convertInHour(cropsSettings[0].timeLimit + debut)}**.`
    }

    let content = `__**❖ Your Settings :**__\n\n> ${cropsSettings[0].cropEmoji} You aim for a **${cropsSettings[0].enName}** ${cropsSettings[0].cropEmoji} harvest task available from XP level **${cropsSettings[0].lvl}**.\n> ${cropsSettings[0].cropEmoji} The goal is to harvest **${objectif}** fields.\n> ${cropsSettings[0].cropEmoji} You are at level **${niveau}**, that means **${champs}** fields available at your level.\n\n__**❖ Results :**__${debutText} ${limit} ${heureLimite}\n\n> ${cropsSettings[0].cropEmoji} If you use between **${borneInf0}** and **${champs}** fields, you will have to harvest **${frequency0}** times every **${convertInHour(cropsSettings[0].growthTime)}** your fields over the next **${duration0}**.\n> ${cropsSettings[0].cropEmoji} If you use between **${borneInf1}** and **${borneSup1}** fields, you will have to harvest **${frequency1}** times every **${convertInHour(cropsSettings[0].growthTime)}** your fields over the next **${duration1}**.\n> ${cropsSettings[0].cropEmoji} If you use between **${borneInf2}** and **${borneSup2}** fields, you will have to harvest **${frequency2}** times every **${convertInHour(cropsSettings[0].growthTime)}** your fields over the next **${duration2}**.\n\n__**❖ Next Upgrade :**__\n> ${cropsSettings[0].cropEmoji}  You can reduce your task time to **${durationS}** if you get **${borneSup0}** fields at level **${lvl}**.`;

    const embed = {
      type : "rich",
      title : `Know everything about the ${cropsSettings[0].enName} ${cropsSettings[0].cropEmoji} harvest task`,
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