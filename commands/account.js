const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandIntegerOption, ButtonBuilder, ActionRowBuilder, ComponentType, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require("discord.js");
const { getValues } = require("../functions/getValues")
const { appendValues } = require("../functions/appendValues");
const { batchUpdate } = require("../functions/batchUpdate");
const { update } = require("../functions/update");
const { cache } = require("../functions/cache");
const { filterObjects } = require("../functions/filterObjects");
const { haydayDataBaseSheetId, usersDataBaseSheetId, excludedMachines} = require("../utils/variables")

const key = "account";

module.exports = {
    data : new SlashCommandBuilder()
        .setName(key)
        .setDescription("Help you track what you have stack on your production machines")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("create")
            .setDescription("Create new account")
            .addStringOption(
                new SlashCommandStringOption()
                .setName("account")
                .setDescription("Enter the account name")
                .setRequired(true)
            )
            .addIntegerOption(
                new SlashCommandIntegerOption()
                .setName("level")
                .setDescription("What is its current level ?")
                .setRequired(true)
            )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("manage")
            .setDescription("Manage your accounts")
            .addStringOption(
                new SlashCommandStringOption()
                .setName("account")
                .setDescription("Enter the account name")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                .setName("action")
                .setDescription("What would you like to do ?")
                .setRequired(true)
                .addChoices({
                    name : "Modify Level",
                    value : "modifyLevel"
                },{
                    name : "Modify Account Name",
                    value : "modifyName"
                },{
                    name : "Delete",
                    value : "delete"
                })
            )
        )
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("mastery")
            .setDescription("Add your mastered machines for adapt production time")
            .addStringOption(
                new SlashCommandStringOption()
                .setName("account")
                .setDescription("Enter the account name")
                .setAutocomplete(true)
                .setRequired(true)
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
            const userAccountsData = filterObjects(accountsData, [{prop : "userID", value : userID}])
            const filtered = userAccountsData.filter(account => account.accountName.toLowerCase().includes(focusedValue.toLowerCase()))
            const options = filtered.slice(0, 25).map((choice) => ({ name: choice.accountName + " ⭐" + choice.accountLvL , value: choice.accountID}));
            await interaction.respond(options);
        }
    },
  
    async execute(interaction){
        const subcommand = interaction.options.data[0].name;
        const user = interaction.user;
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

        if(subcommand === "create") {
            const userAccount = user.username + "#" + user.discriminator;
            const accountName = interaction.options.data[0].options[0].value;
            const accountLvL = interaction.options.data[0].options[1].value;
            const randomNumber = Math.floor(1000 + (9999 - 1000) * Math.random()) 
            const accountID = userAccount + randomNumber
            const dataToAdd = [[user.id, userAccount, accountName, accountID , accountLvL]];
            const accountData = accountsData.filter( account => account.accountName === accountName)

            if (accountData.length>0) {
                
                const confirm = new ButtonBuilder()
                .setCustomId('confirm')
                .setLabel('Confirm Creation')
                .setStyle(ButtonStyle.Danger);

                const cancel = new ButtonBuilder()
                .setCustomId('cancel')
                .setLabel('Cancel')
                .setStyle(ButtonStyle.Secondary);

                const row = new ActionRowBuilder()
                .addComponents(cancel, confirm);

                const message =  await interaction.reply({
                    content : `Be careful, the account name ${accountName} already exist, do you want to create a new account with the same name ? Can be confusing at the end.`,
                    components : [row],
                    ephemeral : true
                });

                const collector = message.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15000 });

                collector.on('collect', async i => {
                    if (i.user.id === interaction.user.id && i.customId === "confirm") {
                        const appendValuesPromise = appendValues(usersDataBaseSheetId,"stackingData", dataToAdd);
                        
                        const replyPromise = i.reply({
                            content : `${accountName} has been added to your account list!`,
                            ephemeral : true
                        })
                        Promise.all(appendValuesPromise, replyPromise);
                        cache.del('accountsData');
                        return
                    }
                });
                
                collector.on('end', collected => {
                    console.log(`Collected ${collected.size} interactions.`);
                });
            } else if (accountData.length===0) {
                const appendValuePromise = appendValues(usersDataBaseSheetId,"stackingData", dataToAdd);
                cache.del('accountsData')

                const replyPromise = interaction.reply({
                    content : `The account ${accountName} level ${accountLvL} has been added to your accounts list!`,
                    ephemeral : true
                })
                await Promise.all([appendValuePromise, replyPromise]);
                cache.del('accountsData');
                return
            }
        } else if (subcommand === "manage"){
            const accountID = interaction.options.data[0].options[0].value;
            const action = interaction.options.data[0].options[1].value;
            const accountData = accountsData.filter(account => account.accountID == accountID)[0];
            if (action === "modifyLevel" || action === "modifyName") {
                const filter = response => {
                    if (action === "modifyLevel") {
                        const userAnswer = response.content;
                        if(user.id === response.author.id && !Number.isInteger(parseInt(userAnswer))){
                            interaction.followUp({
                                content: `Please enter a valid integer value. Your input "${userAnswer}" is not a valid integer.`,
                                ephemeral: true
                            });
                            response.delete()
                            return false;
                        }
                    }
                    return user.id === response.author.id;
                }
                const question = action === "modifyLevel" ? `What level shoud replace the level ${accountData.accountLvL} for your account ${accountData.accountName}` : `What is the new name of your account (LeveL ${accountData.accountLvL}) ?`
                const columnToModify = action === "modifyLevel" ? "accountLvL" : "accountName"
                interaction.reply({
                    content : question,
                    fetchReply : true,
                    ephemeral : true
                })
                .then(() => {
                    interaction.channel.awaitMessages({ filter, max : 1, time: 30000, errors: ['time']})
                    .then(collected => {
                        const userAnswer = action === "modifyLevel" ? parseInt(collected.first().content) : collected.first().content;
                        update(usersDataBaseSheetId, "stackingData", [{column : "accountID", value : accountID}], userAnswer, columnToModify)
                        .then( result => {
                            const confirmationText = action === "modifyLevel" ? `Level **${userAnswer}** has been taken into consideration for your account ${accountData.accountName}!` : `New name **${userAnswer}** has been taken into consideration for your account ${accountData.accountName}!`

                            interaction.followUp({
                                content :confirmationText,
                                ephemeral : true
                            });
                            cache.del('accountsData');
                        })
                        collected.first().delete();
                    })
                    .catch(collected => {
                        console.log(collected)
                        interaction.followUp({
                            content : 'The answer was not given in time. Please reuse the command.',
                            ephemeral : true
                        });
                    });
                })
   
                //change also all the entries in stackingData

            } else if (action ==="delete") {
                const batchUpdatePromise = batchUpdate(usersDataBaseSheetId, "stackingData", [{column : "accountID", value : accountID}])
                const replyPromise = interaction.reply({
                    content : `Your account ${accountData.accountName} Level ${accountData.accountLvL} has been deleted from the database `,
                    ephemeral : true
                })
                await Promise.all([batchUpdatePromise, replyPromise])
                cache.del('accountsData');
            }
        } else if (subcommand === "mastery") {
            const accountID = interaction.options.data[0].options[0].value;
            const accountLvL = accountsData.find( account => account.accountID === accountID).accountLvL;
            const userStackingData = filterObjects(accountsData, [{prop : "accountID", value : accountID}])

            const machinesData = filterObjects(emojisData, [{prop: "Cat" , value : "Machines" }])

            const machines = machinesData
            .filter( machine => {
                const regex = / #\d+$/;
                return !regex.test(machine.enName);
            })
            .filter(machine => parseInt(machine.LvL) <= parseInt(accountLvL) && !excludedMachines.includes(machine.enName))
            .map((choice) => ({ name: choice.enName + " ⭐" + choice.LvL , value: choice.enName, emoji : choice.emoji}));

            const optionsRows = [];
            const createSelectMenus = (options) => {
                const selectMenus = [];
                const numOptions = options.length;
                const PAGE_SIZE_MAX = 25;
                const numSelectMenus = Math.ceil(numOptions/PAGE_SIZE_MAX);
                const registeredMastery = userStackingData[0].mastery ? userStackingData[0].mastery.split(", ") : [];

                for (let i = 0 ; i< numSelectMenus; i++) {
                    const startIndex = i * PAGE_SIZE_MAX;
                    const endIndex = startIndex + PAGE_SIZE_MAX;
                    const slicedOptions = options.slice(startIndex, endIndex);
                    optionsRows.push(slicedOptions);
                    const selectMenu = new StringSelectMenuBuilder()
                    .setCustomId(`mastery_${i}`)
                    .setPlaceholder(`Select your mastered machines`)
                    .setMinValues(0)
                    .setMaxValues(slicedOptions.length)

                    slicedOptions.forEach(machine => {
                        let registered = registeredMastery.includes(machine.value);
                        const option = new StringSelectMenuOptionBuilder()
                        .setLabel(machine.name)
                        .setValue(machine.value)
                        .setEmoji(`${machine.emoji}`)
                        .setDefault(registered)
                        selectMenu.addOptions(option);
                    })

                    const row = new ActionRowBuilder()
                    .addComponents(selectMenu)

                    selectMenus.push(row)
                }
                return selectMenus;
            }
            
            const rows = createSelectMenus(machines)

            const selectMachines = await interaction.reply({
                content : "Choose the machines you have mastered so that I can recalculate the completion times of the derby tasks adapted to your setup",
                components : rows,
                ephemeral : true
            })

            
            const selectionsCollector = selectMachines.createMessageComponentCollector({
                componentType: ComponentType.StringSelect,
                time: 3*60*1000
            });

            selectionsCollector.on('collect', async i => {

                const selectMenuId = i.customId;
                const index = parseInt(selectMenuId.split('_')[1]);
                const accountData = filterObjects(accountsData, [{prop : "accountID", value : accountID}])
                const masterySaved = accountData[0].mastery ? accountData[0].mastery.split(', '): [];
                const masterySelected = i.values; 
                
                const masteryToSave = masterySaved.filter(machine => {
                    return !optionsRows[index].some(option => option.value === machine)
                }).concat(masterySelected);
                
                const updatePromise = update(usersDataBaseSheetId, "stackingData", [{column : "accountID", value : accountID}], masteryToSave.join(", "), "mastery");

                const replyPromise = i.reply({
                    content : 'Your selection has been successful saved.',
                    ephemeral : true
                });
                await Promise.all([updatePromise, replyPromise])
                cache.del('accountsData')

            });

            selectionsCollector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    await interaction.followUp({
                        content : 'Time to respond is expired (3min), please, redo the `/stacking mastery` to continue the process.',
                        ephemeral : true
                    });
                }
            })
        }
    }
}