const { SlashCommandBuilder, SlashCommandIntegerOption, SlashCommandStringOption, SlashCommandNumberOption, SlashCommandSubcommandBuilder } = require("@discordjs/builders");
const { botColor } = require('../utils/variables.js');
const { convertInHour }= require('../functions/convertInHour.js');
const { getValues } = require("../functions/getValues.js");
const { haydayDataBaseSheetId } = require("../utils/variables.js");
const { illustratedFooter, devFooter } = require("../messages/footers.js")

const key = "fishing";

const scenarii = {
  30 : "As soon as ready",
  120 : "Every 2 hours",
  180 : "Every 3 hours",
  240 : "Every 4 hours"
}

const eM = {
  3 : 8,
  4 : 12,
  5 : 14,
  6 : 14,
  7 : 16,
  8 : 18,
  9 : 20,
  10 : 22,
  11 : 24,
  12 : 26,
  13 : 28,
  14 : 30,
  15 : 32
}

module.exports = {

  data : new SlashCommandBuilder()
    .setName(key)
    .setDescription("Everything about fishing task")
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
      .setName("task")
      .setDescription("Calculates the time needed to finish a fishing task according to the unlocked fishing spots")
      .addIntegerOption(
        new SlashCommandIntegerOption()
        .setName("target")
        .setDescription("Number of lbs to fish? (The classic 320 task requires 110 lbs)")
        .setRequired(true)
      )
      .addNumberOption(
        new SlashCommandNumberOption()
          .setName("spots")
          .setDescription("Number of fishing spots available ?")
          .setRequired(true)
          .setMaxValue(15)
          .setMinValue(2)
      )
      .addIntegerOption(
        new SlashCommandIntegerOption()
          .setName("scenarios")
          .setDescription("Choose a scenario")
          .setRequired(true)
          .addChoices({
            name : "As soon as ready",
            value : 30
          },
          {
            name : "Every 4 hours",
            value : 4*60
          },
          {
            name : "Every 3 hours",
            value : 3*60
          },
          {
            name : "Every 2 hours",
            value : 2*60
          })
      )
      .addStringOption(
        new SlashCommandStringOption()
          .setName("start")
          .setDescription("At what time (hh:mm) will you start the task? I will calculate the minimum end time for you.")
          .setRequired(false)
      )
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
      .setName("salmon")
      .setDescription("How to fish for Sockeyes Salmons only ?")
    )
    .addSubcommand(
      new SlashCommandSubcommandBuilder()
      .setName("event")
      .setDescription("How to catch only event fish at a fishing event ?"),
    ),

  async execute(interaction){
    if (interaction.options.getSubcommand() === "task"){
      const objectif = interaction.options.data[0].options[0].value;
      const coins = interaction.options.data[0].options[1].value;
      let pas = interaction.options.data[0].options[2].value;
      let scenario = scenarii[pas];
      let debut = 0;

      const taskParams = [
        {prop : "enName", value : key}
      ];

      const taskSettings = await getValues(haydayDataBaseSheetId, "HDemojis", taskParams);

      if (interaction.options.data[0].options[3]){
        let heures = Number(interaction.options.data[0].options[3].value.substring(0,2));
        let minutes = Number(interaction.options.data[0].options[3].value.substring(4,5));
        debut = heures * 60 + minutes;
      }

      const deux = Math.max(0,(coins-0)/Math.max(1,Math.abs(coins-0)))+Math.max(0,(coins-4)/Math.max(1,Math.abs(coins-4)))+Math.max(0,(coins-10)/Math.max(1,Math.abs(coins-10)));
      const deuxH30 = (Math.max(0,(coins-3)/Math.max(1,Math.abs(coins-3)))+Math.max(0,(coins-5)/Math.max(1,Math.abs(coins-5)))+Math.max(0,(coins-11)/Math.max(1,Math.abs(coins-11))));
      const trois = (Math.max(0,(coins-0)/Math.max(1,Math.abs(coins-0)))+Math.max(0,(coins-2)/Math.max(1,Math.abs(coins-2)))+Math.max(0,(coins-9)/Math.max(1,Math.abs(coins-9)))+Math.max(0,(coins-12)/Math.max(1,Math.abs(coins-12)))+Math.max(0,(coins-13)/Math.max(1,Math.abs(coins-13)))+Math.max(0,(coins-14)/Math.max(1,Math.abs(coins-14))));
      const quatre = (Math.max(0,(coins-6)/Math.max(1,Math.abs(coins-6)))+Math.max(0,(coins-7)/Math.max(1,Math.abs(coins-7)))+Math.max(0,(coins-8)/Math.max(1,Math.abs(coins-8))));

      const poidsMoyen = 3.6;
      const poidsSaumon = 4;
      const poidsEvent = 10;

      let n = 1 ;
      let reste = objectif/poidsMoyen - coins;
      let total = coins;

      let step = `> 0) At T = **${convertInHour(debut)}**, fishing 🔵 **${deux}** x 2H, 🟢 **${deuxH30}** x 2H30, 🟠 **${trois}** x 3H, 🔴 **${quatre}** x 4H
      > ${taskSettings[0].emoji} You will have caught a total of **${total}** fish. There will be **${Math.ceil(reste)}/${Math.ceil(objectif/poidsMoyen)}** fish left to catch.
      `;

      let a = 0;
      let b = 0;
      let c = 0;
      let d = 0;

      let deuxText = ``;
      let deuxH30Text = ``;
      let troisText = ``;
      let quatreText = ``;

      let i = 1;

      while (reste > 0) {
        let w = 0;  // si >0 alors coin pêche prêt
        let x = 0;
        let y = 0;
        let z = 0;

        if (deux*Math.floor(pas/(2*60)*n-a)>= 1){
          deuxText = `🔵 **${deux}** x 2H,`;
          w++;
          a++;
        } else {
          deuxText = ``;
        }
        if (deuxH30*Math.floor(pas/(2.5*60)*n-b) >= 1){
          deuxH30Text = `🟢 **${deuxH30}** x 2H30,`;
          x++;
          b++;
        } else {
          deuxH30Text = ``;
        }
        if (trois*Math.floor(pas/(3*60)*n-c)  >= 1) {
          troisText = `🟠 **${trois}** x 3H,`;
          y++;
          c++;
        } else {
          troisText = ``;
        }
        if (quatre*Math.floor(pas/(4*60)*n-d)  >= 1) {
          quatreText = `🔴 **${quatre}** x 4H`;
          z++;
          d++;
        } else {
          quatreText = ``;
        }

        reste = reste - (w*deux + x*deuxH30 + y*trois + z*quatre);
        total += (w*deux + x*deuxH30 + y*trois + z*quatre);

        if ((w*deux + x*deuxH30 + y*trois + z*quatre)>0){

          step += `\n> ${i}) At T = **${convertInHour(n*pas+ debut)}**, fishing ${deuxText} ${deuxH30Text} ${troisText} ${quatreText}\n> ${taskSettings[0].emoji} You will have caught a total of  **${total}** fish. There will be  **${Math.ceil(reste)}/${Math.ceil(objectif/poidsMoyen)}** fish left to catch.`;
          i++;
        }
        n++;
      ;}

      let improve = ``;
      if (coins < 15 ) {
        improve = `__**❖ Next Upgrade :**__\n\n> ${taskSettings[0].emoji} Your next fishing spot to unlock is the #**${coins+1}** spot.\n> ${taskSettings[0].emoji} It will require **${eM[coins+1]}** x Extension Materials`
      }

      let content = `\n\n__**❖ Your settings :**__\n> ${taskSettings[0].emoji} You aim for a fishing task with a goal of **${objectif}** lbs of fish to catch.\n> ${taskSettings[0].emoji} You own **${coins}** fishing spots. That means a fishing pond of :\n> 🔵 **${deux}** fishing spots with **2H** of cooldown.\n> 🟢 **${deuxH30}** fishing spots with **2H30** of cooldown.\n> 🟠 **${trois}** fishing spots with **3H** of cooldown.\n> 🔴 **${quatre}** fishing spots with **4H** of cooldown.\n\n__**❖ Results :**__\n\nIt will be necessary to fish :\n> ${taskSettings[0].emoji} **${Math.ceil(objectif/poidsMoyen)}** fish for an average weight of **${poidsMoyen}** lbs.\n> ${taskSettings[0].emoji} **${Math.ceil(objectif/poidsSaumon)}** fish for an average weight of **${poidsSaumon}** lbs. *(The subcommand \`/fishing salmon\` can give you more informations about the sockeye fishery)*\n> ${taskSettings[0].emoji} **${Math.ceil(objectif/poidsEvent)}** fish for an average weight of **${poidsEvent}** lbs. *(The subcommand \`/fishing event\` can give you more informations about fishing during fishing event)*\n\n__**❖ Scenario :**__\n\n> ${taskSettings[0].emoji} Selected fishing frequency : **${scenario}**\n> ${taskSettings[0].emoji} Specified starting time : **${convertInHour(debut)}**\n> ${taskSettings[0].emoji} Estimated end time : **${convertInHour((n-1)*pas + debut)}**\n\n${step}\n\n${improve}`;

      const embed = {
        type : "rich",
        title : `All about the fishing task ${taskSettings[0].emoji}`,
        description : content,
        color : botColor,
        image: {
          url: "https://cdn.discordapp.com/attachments/1085934953302331464/1085935870978314310/IMG_7580.jpg",
          height: 0,
          width: 0
        },
        footer : {
          text : illustratedFooter,
          icon_url : interaction.guild.iconURL()
        }
      }
      await interaction.reply({embeds : [embed]});
    } else if (interaction.options.getSubcommand() === "salmon") {

      let title = `How to recognize sockeye salmon (average weight: 4 lbs)?`

      let content = `Use red lure (free).\n\nAs soon as the fish bites, drag your line as far away from the fish as possible to observe the movement speed.\n\n1) Salmon will always move slowly.\n2) Salmon will tend to struggle to go in the opposite direction of the pull.\nVideo to see the swimming speed of a salmon:`

      const embed = {
          type : "rich",
          title : title,
          description : content,
          color : botColor,
          footer : {
            text : devFooter,
            icon_url : interaction.guild.iconURL()
          }
      }

      await interaction.reply({embeds : [embed]});
      await interaction.channel.send({content : `||https://youtu.be/fGfbhhOmPsc||`})

    } else if (interaction.options.getSubcommand() === "event") {
      let title = `How to recognize an event fish during a fishing event (average weight: 10 lbs)?`

      let content = `Use green, yellow, purple, blue lures (cost vouchers).\n\nObserve the size of the white circle in the middle:\nIf the fish appears too big for the white circle (corresponds to the Small size of the image), it's an event fish.`

      const embed = {
          type : "rich",
          title : title,
          description : content,
          color : botColor,
          image: {
            url: "https://cdn.discordapp.com/attachments/1039441521851772968/1063027141400346695/image.png",
            height: 0,
            width: 0
          },
          footer : {
            text : devFooter,
            icon_url : interaction.guild.iconURL()
          }

        }
      await interaction.reply({embeds : [embed]});
    }
  }
};