const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder, ButtonBuilder, ActionRowBuilder, ComponentType, ButtonStyle, SlashCommandBooleanOption} = require("discord.js");
const { getValues } = require("../functions/getValues")
const { filterObjects } = require("../functions/filterObjects");
const { cache } = require("../functions/cache");
const { masteryTasksFooter, freeFooter } = require("../messages/footers");
const { displayMachineViewEmbed, generateField, generateListOfQueue } = require('../functions/generateView');
const { convertInHour } = require("../functions/convertInHour");
const { haydayDataBaseSheetId, usersDataBaseSheetId, botColor, emojiXP, excludedMachines, excludedProductionTask } = require("../utils/variables")

const key = "view";

module.exports = {
    data : new SlashCommandBuilder()
        .setName(key)
        .setDescription("Display decision-making aid views.")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("machine")
            .setDescription("Display a view focus on a single machine stacking and derby informations.")
            .addStringOption(
                new SlashCommandStringOption()
                .setName("account")
                .setDescription("Enter the account name")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                .setName("machine")
                .setDescription("What machine do you want details on it ?")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addBooleanOption(
                new SlashCommandBooleanOption()
                .setName("show")
                .setDescription("Show my response to the chanel users ?")
                .setRequired(false)
            )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("stacking")
            .setDescription("Display a view with all the stacked queue.")
            .addStringOption(
                new SlashCommandStringOption()
                .setName("account")
                .setDescription("Enter the account name")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                .setName("filter")
                .setDescription("Choose a specific machine filter")
                .addChoices({
                    name : "Not empty queue machines",
                    value : "empty"
                },{
                    name : "Derby involved machines",
                    value : "derby"
                })
                .setRequired(false)
            )
            .addBooleanOption(
                new SlashCommandBooleanOption()
                .setName("show")
                .setDescription("Show my response to the chanel users ?")
                .setRequired(false)
            )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("derby")
            .setDescription("Manage your accounts")
            .addStringOption(
                new SlashCommandStringOption()
                .setName("account")
                .setDescription("Enter the account name")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addBooleanOption(
                new SlashCommandBooleanOption()
                .setName("power")
                .setDescription("True to display power derby requierements. (By default : Normal derby data)")
                .setRequired(false)
            )
            .addBooleanOption(
                new SlashCommandBooleanOption()
                .setName("show")
                .setDescription("Show my response to the chanel users ?")
                .setRequired(false)
            )
        ),
  
    async autocomplete(interaction){
        const userID = interaction.user.id;
        let {accountsData, emojisData, derbyTasksData} = cache.mget(['accountsData','emojisData','derbyTasksData']);
        if (!accountsData || !emojisData  || !derbyTasksData) {
            const accountsDataPromise = accountsData ? Promise.resolve(accountsData) : getValues(usersDataBaseSheetId, "stackingData");
            const emojisDataPromise = emojisData ? Promise.resolve(emojisData) : getValues(haydayDataBaseSheetId, "HDemojis");
            const derbyTasksDataPromise = derbyTasksData ? Promise.resolve(derbyTasksData) : getValues(haydayDataBaseSheetId, "pollTasks");

            [accountsData, emojisData, derbyTasksData] = await Promise.all([accountsDataPromise, emojisDataPromise, derbyTasksDataPromise]);
            
            // Mise en cache des données
            if (!cache.get('accountsData')) {
                cache.set('accountsData', accountsData);
            }
        
            if (!cache.get('emojisData')) {
            cache.set('emojisData', emojisData);
            }
        
            if (!cache.get('derbyTasksData')) {
            cache.set('derbyTasksData', derbyTasksData);
            }
        }
        
        const focusedOption = interaction.options.getFocused(true);
        const focusedValue = focusedOption.value;
        if(focusedOption.name === "account"){
            const accountFilter = [
                {prop : "userID", value : userID},
            ]
            const userAccountsData = filterObjects(accountsData, accountFilter)
            const filtered = userAccountsData.filter(account => account.accountName.toLowerCase().includes(focusedValue.toLowerCase()))
            const options = filtered.slice(0, 25).map((choice) => ({ name: choice.accountName + " ⭐" + choice.accountLvL , value: choice.accountID}));
            await interaction.respond(options);

        } else if (focusedOption.name === "machine") {
            const accountID = interaction.options.data[0].options[0].value;
            const accountFilter = [
                {prop : "userID", value : userID},
            ]
            const userAccountsData = filterObjects(accountsData, accountFilter);
            const accountLvL = userAccountsData.find( account => account.accountID === accountID).accountLvL;


            let machinesData = cache.get('machinesData');
            if (!machinesData) {
            const machinesFilter = [{ prop: "Cat", value: "Machines" }];
            machinesData = filterObjects(emojisData, machinesFilter);
            // Mise en cache des données
            cache.set('machinesData', machinesData);
            }

            const filtered = machinesData.filter( machine => machine.enName.toLowerCase().includes(focusedValue.toLowerCase()))
            const options = filtered
            .filter(machine => parseInt(machine.LvL) <= parseInt(accountLvL) && !excludedMachines.includes(machine.enName) )
            .slice(0, 25)
            .map((choice) => ({ name: choice.enName + " ⭐" + choice.LvL , value: choice.enName}));

            await interaction.respond(options);
        }
    },
  
    async execute(interaction){
        const subcommand = interaction.options.data[0].name;
        const user = interaction.user;
        let {accountsData, emojisData, derbyTasksData} = cache.mget(['accountsData','emojisData','derbyTasksData']);
        if (!accountsData || !emojisData  || !derbyTasksData) {
            const accountFilter = [
                {prop : "userID", value : user.id},
            ]
            const accountsDataPromise = accountsData ? Promise.resolve(accountsData) : getValues(usersDataBaseSheetId, "stackingData", accountFilter);
            const emojisDataPromise = emojisData ? Promise.resolve(emojisData) : getValues(haydayDataBaseSheetId, "HDemojis");
            const derbyTasksDataPromise = derbyTasksData ? Promise.resolve(derbyTasksData) : getValues(haydayDataBaseSheetId, "pollTasks");

            [accountsData, emojisData, derbyTasksData] = await Promise.all([accountsDataPromise, emojisDataPromise, derbyTasksDataPromise]);
            
            // Mise en cache des données
            if (!cache.get('accountsData')) {
                cache.set('accountsData', accountsData);
            }
        
            if (!cache.get('emojisData')) {
            cache.set('emojisData', emojisData);
            }
        
            if (!cache.get('derbyTasksData')) {
            cache.set('derbyTasksData', derbyTasksData);
            }
        }

        if (subcommand === "machine") {
            const accountID = interaction.options.data[0].options[0].value;
            const machine = interaction.options.data[0].options[1].value;
            const show = interaction.options.data[0].options[2]?.value ?? false;
            let ephemeral = !show ? true : false;

            const accountLvL = accountsData.find( account => account.accountID === accountID).accountLvL;
            const userStackingData = filterObjects(accountsData, [{prop : "accountID", value : accountID}])

            machineStackingData = userStackingData[0][machine] !== undefined ? userStackingData[0][machine].split(", ") : [];
            
            const regex = / #\d+$/;
            const machineBase = machine.replace(regex, "");

            const productsFilter = [{prop: "productionMachine" , value : machineBase }];
            const productsData = filterObjects(emojisData, productsFilter)
            const filteredProductsOfSelectedMachine = productsData
            .filter(product => parseInt(product.LvL) <= parseInt(accountLvL))
            .map( product => product.enName);


            const embed = displayMachineViewEmbed(machineStackingData, emojisData, filteredProductsOfSelectedMachine, derbyTasksData, userStackingData, accountLvL, machine, interaction)

            await interaction.reply({
                embeds : [embed],
                ephemeral : ephemeral
            })

        } else if (subcommand === "stacking") {
            const accountID = interaction.options.data[0].options[0].value;
            const filter = interaction.options.data[0].options[1]?.value ?? false;
            const show = interaction.options.data[0].options[2]?.value ?? false;
            let ephemeral = !show ? true : false;

            const accountLvL = accountsData.find( account => account.accountID === accountID).accountLvL;

            const userStackingData = filterObjects(accountsData, [{prop : "accountID", value : accountID}])

            machinesData = filterObjects(emojisData, [{ prop: "Cat", value: "Machines" }]);
            


            const adaptedMachines = machinesData
            .filter(machine => parseInt(machine.LvL) <= parseInt(accountLvL) && !excludedMachines.includes(machine.enName));

            let filteredMachines = adaptedMachines;
            if (filter === "empty") {
                filteredMachines = adaptedMachines.filter(machine => {
                    const products = userStackingData[0][machine.enName] ?? "";
                    const productsInQueue = products !== "" ? products.split(", ") : [];
                    return productsInQueue.length > 0;
                });
            } else if (filter === "derby") {
                const listOfTasks = derbyTasksData.filter(task => 
                    parseInt(task.LvL) <= parseInt(accountLvL) && task.type.includes("Production")
                );
                const machinesInDerbyTasksSet = new Set();
                for (const task of listOfTasks) {
                  const compos = task.Compo.split(", ");
                  for (const compo of compos) {
                    const productionMachine = emojisData.find(prod => prod.enName === compo).productionMachine;
                    machinesInDerbyTasksSet.add(productionMachine);
                  }
                }
                const machinesInDerbyTasks = Array.from(machinesInDerbyTasksSet);
                filteredMachines = adaptedMachines.filter(machine => machinesInDerbyTasks.some(mach => mach === machine.enName));
            }

            const itemsPerPage = 10;
            const pages = [];
            for (let i = 0; i < filteredMachines.length ; i += itemsPerPage) {
                const machinesPerPage = filteredMachines.slice( i, i+itemsPerPage);
                pages.push(machinesPerPage)
            }

            let currentPage = 0;
            let filterName = "of Every Available Machines ";
            if (filter === "empty"){
                filterName = "of None empty queue Machines "
            } else if ( filter === "derby") {
                filterName = "of Derby Involved Machines "
            }
            const createEmbed = (page) => {
                const allFields = [];                   
                for (const machine of page){
                    let products = userStackingData[0][machine.enName] ?? "";
                    const productsInQueue = products !== "" ? products.split(", ") : [];
                    const listOfQueue = generateListOfQueue(productsInQueue, emojisData).length > 0 ? generateListOfQueue(productsInQueue, emojisData) : "No entry yet";

                    const machineField = generateField(`${machine.emoji}${machine.enName} ${emojiXP}${machine.LvL} (${productsInQueue.length}/50)`, `> ${listOfQueue}`, false);
                    allFields.push(machineField)
                    
                }

                const embed = {
                    type : "rich",
                    title : `Queuing State ${filterName}on ${userStackingData[0].accountName}${emojiXP}${userStackingData[0].accountLvL}`,
                    fields : allFields,
                    color : botColor,
                    footer : {
                        text : freeFooter,
                        icon_url : interaction.guild.iconURL()
                    }
                }
                return embed;
            }

            const embed = createEmbed(pages[currentPage]);

            const previous = new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary);

            const next = new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
            .addComponents(previous, next);


            const message = await interaction.reply({
                embeds: [embed],
                components : [row],
                ephemeral: ephemeral
            });
                
                
            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 2*60*1000 });
                
            collector.on('collect', async i => {
                if (i.user.id === interaction.user.id && i.customId === "previous") {
                currentPage--;

                if (currentPage < 0) {
                    currentPage = pages.length - 1;
                }
                } else if (i.user.id === interaction.user.id && i.customId === "next") {
                currentPage++;
                    if (currentPage >= pages.length) {
                        currentPage = 0;
                    }
                }
                
                const updatedEmbed = createEmbed(pages[currentPage]);

                await i.update({ 
                    embeds: [updatedEmbed],
                });
            });
        } else if (subcommand === "derby") {
            const accountID = interaction.options.data[0].options[0].value;
            const power = interaction.options.data[0].options[1]?.value ?? false;
            const show = interaction.options.data[0].options[2]?.value ?? false;
            let ephemeral = !show ? true : false;

            const accountLvL = accountsData.find( account => account.accountID === accountID).accountLvL;
            const userStackingData = filterObjects(accountsData, [{prop : "accountID", value : accountID}])
            const listOfTasks = derbyTasksData.filter(task => 
                parseInt(task.LvL) <= parseInt(accountLvL) && task.type.includes("Production")
            );

            const taskTypeToShow = new Set();
            for (const task of listOfTasks ){
                taskTypeToShow.add(task.type)
            }

            const taskTypeToShowArray = Array.from(taskTypeToShow);

            let currentPage = 0;

            const tasksToDisplay = listOfTasks.filter(task => task.type === taskTypeToShowArray[currentPage] );
            
            const createEmbed = (tasksToDisplay) => {
                const taskFields = []
                for (let i = 0; i < tasksToDisplay.length; i++) {
                    const task = tasksToDisplay[i]
                    let listOfCompo = "";
                    const qtysStandard = Object.entries(task)
                    .filter(([key, value]) => key.startsWith('Qty'+ 'Standard'))
                    .map(([key, value]) => value);
                    const qtysHalf = Object.entries(task)
                    .filter(([key, value]) => key.startsWith('Qty'+ 'Half'))
                    .map(([key, value]) => value);
                    const mainQty = power ?  qtysHalf : qtysStandard; 
                    const altQty = power ? qtysStandard : qtysHalf ; 
                    const compos = task.Compo.split(", ")
                    let allComponentsReachQty = true;
                    for (let index = 0; index < compos.length; index++) {
                        const {emoji : productEmoji, productionMachine : compoMachine, mastery : durationMastered, duration : durationStandard, enName} = emojisData.find(prod => prod.enName === compos[index]);

                        const machinesData = Object.keys(userStackingData[0]).filter(key => key.includes(compoMachine)).map(key => userStackingData[0][key]);

                        const productsStacked = machinesData.join(', ');
                        const productsStackedArray = productsStacked ? productsStacked.split(", ") : [];
                        const occurences = productsStackedArray.filter( prod => prod === compos[index]).length;

                        const masteredMachines = userStackingData[0].mastery ? userStackingData[0].mastery.split(", ") : [];
    
                        const applyMastery = masteredMachines.includes(compoMachine);

                        const duration = applyMastery ? durationMastered : durationStandard;
                        const masteredSign = applyMastery ? "⭐" : "";
                        
                        const mainDuration = duration? ` (${masteredSign}${convertInHour(duration*mainQty[index])})`: "";
                        const altDuration = duration ? ` (${masteredSign}${convertInHour(duration*altQty[index])})` : "";

                        const powerSignMain = power ? "💪" : "";
                        const powerSignAlt = power ? "" : "💪";

                        if (occurences < mainQty[index] && !excludedProductionTask.includes(enName)){
                            allComponentsReachQty = false;
                        }
    
                        listOfCompo += `> ${productEmoji} x ${powerSignMain} **${occurences}**/*${mainQty[index]}*${mainDuration}\n> ||${powerSignAlt}**${occurences}**/${altQty[index]} ${altDuration}||`
                        if (index < compos.length - 1) {
                            listOfCompo += "\n";
                        }
                    }
                    


                    const checkEmoji = allComponentsReachQty ? " ✅" : "";

                    const taskField = generateField(`${task.taskEmoji} **${task.enTaskName}** ${checkEmoji}`,`${listOfCompo}`, true)
                    taskFields.push(taskField);
                }
                const embed = {
                    type : "rich",
                    title :`${taskTypeToShowArray[currentPage]} Tasks State on ${userStackingData[0].accountName}${emojiXP}${userStackingData[0].accountLvL}`,
                    fields : taskFields,
                    color : botColor,
                    footer : {
                        text : masteryTasksFooter,
                        icon_url : interaction.guild.iconURL()
                    }
                }
                return embed;
            }
                
            const embed = createEmbed(tasksToDisplay);

            
            const previous = new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('Previous')
            .setStyle(ButtonStyle.Primary);

            const next = new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next')
            .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
            .addComponents(previous, next)


            // Ajouter les informations de pagination
            const message = await interaction.reply({ embeds: [embed], components : [row], 
                ephemeral: ephemeral });

            const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 2*60*1000 });
                
            collector.on('collect', async i => {
                if (i.user.id === interaction.user.id && i.customId === "previous") {
                    currentPage--;
                    if (currentPage < 0) {
                        currentPage = taskTypeToShowArray.length - 1;
                    }
                } else if (i.user.id === interaction.user.id && i.customId === "next") {
                    currentPage++;
                    if (currentPage >= taskTypeToShowArray.length) {
                        currentPage = 0;
                    }
                    
                }
                const tasksToDisplay = listOfTasks.filter(task => task.type === taskTypeToShowArray[currentPage])
                const updatedEmbed = createEmbed(tasksToDisplay);

                await i.update({ 
                    embeds: [updatedEmbed],
                });
            });
        } 
    }
}