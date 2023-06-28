const { SlashCommandBuilder, SlashCommandStringOption, SlashCommandSubcommandBuilder, SlashCommandIntegerOption, SlashCommandBooleanOption } = require("discord.js");
const { getValues } = require("../functions/getValues")
const { update } = require("../functions/update");
const { filterObjects } = require("../functions/filterObjects");
const { cache } = require("../functions/cache");
const { displayMachineViewEmbed, displayQueueViewEmbed } = require('../functions/generateView')
const { haydayDataBaseSheetId, usersDataBaseSheetId, excludedMachines} = require("../utils/variables")

const key = "stacking";

module.exports = {
    data : new SlashCommandBuilder()
        .setName(key)
        .setDescription("Help you track what you have stack on your production machines")
        .addSubcommand(
            new SlashCommandSubcommandBuilder()
            .setName("add")
            .setDescription("Add products in list of product for a machine")
            .addStringOption(
                new SlashCommandStringOption()
                .setName("account")
                .setDescription("For which account name")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                .setName("machine")
                .setDescription("On which machine ?")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                .setName("product")
                .setDescription("Which product ?")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addIntegerOption(
                new SlashCommandIntegerOption()
                .setName("number")
                .setDescription("How much of that product did you queue ?")
                .setMinValue(1)
                .setRequired(true)
            )
            .addBooleanOption(
                new SlashCommandBooleanOption()
                .setName("details")
                .setDescription("Display derby details in the result embed ?")
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
            .setName("remove")
            .setDescription("Remove products from the list")
            .addStringOption(
                new SlashCommandStringOption()
                .setName("account")
                .setDescription("The account name")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                .setName("machine")
                .setDescription("On which machine ?")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addStringOption(
                new SlashCommandStringOption()
                .setName("from")
                .setDescription("Choose between modifying the beginning or the end of the list")
                .setRequired(true)
                .addChoices({
                    name : "The start",
                    value : "start",
                },
                {
                    name : "The end",
                    value : "end"
                })
            )
            .addIntegerOption(
                new SlashCommandIntegerOption()
                .setName("number")
                .setDescription("How much products would you like to remove from the list ?")
                .setRequired(true)
            )
            .addBooleanOption(
                new SlashCommandBooleanOption()
                .setName("details")
                .setDescription("Display derby details in the result embed ?")
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
        } else if (focusedOption.name === "product") {
            const accountID = interaction.options.data[0].options[0].value;
            const accountFilter = [
                {prop : "userID", value : userID},
            ]
            const userAccountsData = filterObjects(accountsData, accountFilter);
            const accountLvL = userAccountsData.find( account => account.accountID === accountID).accountLvL;

            const machine = interaction.options.data[0].options[1].value.replace(/ #\d+$/, "");

            let productsData = cache.get('productsData')
            if (!productsData) {
                const productsFilter = [{prop : 'Cat', value : "Products"}]
                productsData = filterObjects(emojisData, productsFilter);
                // Mise en cache des données
                cache.mset(
                    {key : 'emojisData', value : emojisData},
                    {key : 'productsData', value : productsData}
                );
            }

            const productsMachine = filterObjects(productsData, [{ prop: "productionMachine", value: machine}])

            const filtered = productsMachine.filter( product => product.enName.toLowerCase().includes(focusedValue.toLowerCase()))
            const options = filtered
            .filter(product => parseInt(product.LvL) <= parseInt(accountLvL))
            .slice(0, 25)
            .map((choice) => ({ name: choice.enName + " ⭐" + choice.LvL , value: choice.enName}));

            await interaction.respond(options);
        }
    },
  
    async execute(interaction){
        const subcommand = interaction.options.data[0].name;
        const user = interaction.user;
        const accountID = interaction.options.data[0].options[0].value;

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

        if (subcommand === "add") {
            const machine = interaction.options.data[0].options[1].value;
            const product = interaction.options.data[0].options[2].value;
            const number = interaction.options.data[0].options[3].value;
            const details = interaction.options.data[0].options[4]?.value ?? false;
            const show = interaction.options.data[0].options[5]?.value ?? false;
            let ephemeral = !show ? true : false;

            const accountLvL = accountsData.find( account => account.accountID === accountID).accountLvL;
            const userStackingData = filterObjects(accountsData, [{prop : "accountID", value : accountID}])

            // save changes
            let machineStackingData = userStackingData[0][machine] !== undefined ? userStackingData[0][machine].split(", ") : [];

            if (machineStackingData[0] === ''){
                machineStackingData.shift()
            }
            for (let index = 0; index < number; index++) {
                machineStackingData.push(product);
            }
            
            const newQueue = machineStackingData.join(", ");

            // generate products fields 
            const regex = / #\d+$/;
            const machineBase = machine.replace(regex, "");

            const productsFilter = [{prop: "productionMachine" , value : machineBase }];
            const productsData = filterObjects(emojisData, productsFilter)

            const filteredProductsOfSelectedMachine = productsData
            .filter(product => parseInt(product.LvL) <= parseInt(accountLvL))
            .map( product => product.enName);

            //generate queuing value (listOfQueue)

            let embed
            if (details){
                // save new data
                await update(usersDataBaseSheetId, "stackingData", [{column : "accountID", value : accountID}], newQueue, machine);
                // take saved data :
                const userStackingFilter =  [{prop : "accountID", value : accountID}];
                const userStackingData = await getValues(usersDataBaseSheetId, "stackingData", userStackingFilter);
                machineStackingData = userStackingData[0][machine] !== undefined ? userStackingData[0][machine].split(", ") : [];
                embed = displayMachineViewEmbed(machineStackingData, emojisData, filteredProductsOfSelectedMachine, derbyTasksData, userStackingData, accountLvL, machine, interaction)
            } else {
                embed = displayQueueViewEmbed(machineStackingData, emojisData, machine, userStackingData, interaction);
            }

            const replyPromise = interaction.reply({
                embeds : [embed],
                ephemeral : ephemeral
            });
            const updatePromise = update(usersDataBaseSheetId, "stackingData", [{column : "accountID", value : accountID}], newQueue, machine);

            await Promise.all([replyPromise, updatePromise]);
            
            // force the reload of the saved data on googlesheet.
            cache.del('accountsData');

        } else if (subcommand === "remove") {
            
            const machine = interaction.options.data[0].options[1].value;
            const from = interaction.options.data[0].options[2].value;
            const number = interaction.options.data[0].options[3].value;
            const details = interaction.options.data[0].options[4]?.value ?? false;
            const show = interaction.options.data[0].options[5]?.value ?? false;
            let ephemeral = !show ? true : false;

            const accountLvL = accountsData.find( account => account.accountID === accountID).accountLvL;
            const userStackingData = filterObjects( accountsData, [{prop : "accountID", value : accountID}] );

            // save changes

            let machineStackingData = userStackingData[0][machine].split(", ");
            if (from === "start") {
                machineStackingData.splice(0, number)
            } else if (from === "end"){
                machineStackingData.splice(machineStackingData.length-number, number)
            }
            const newQueue = machineStackingData.join(", ");

            const regex = / #\d+$/;
            const machineBase = machine.replace(regex, "");
            
            // generate products fields 
            const productsFilter = [{prop: "productionMachine" , value : machineBase }];
            const productsData = filterObjects(emojisData, productsFilter);

            const filteredProductsOfSelectedMachine = productsData
            .filter(product => parseInt(product.LvL) <= parseInt(accountLvL) && !excludedMachines.includes(machine.enName))
            .map( product => product.enName);

            //generate queuing value (listOfQueue)
            let embed
            if (details){
                // save new data
                await update(usersDataBaseSheetId, "stackingData", [{column : "accountID", value : accountID}], newQueue, machine);
                // take saved data :
                const userStackingFilter =  [{prop : "accountID", value : accountID}];
                const userStackingData = await getValues(usersDataBaseSheetId, "stackingData", userStackingFilter);
                machineStackingData = userStackingData[0][machine] !== undefined ? userStackingData[0][machine].split(", ") : [];

                embed = displayMachineViewEmbed(machineStackingData, emojisData, filteredProductsOfSelectedMachine, derbyTasksData, userStackingData, accountLvL, machine, interaction);

                await interaction.reply({
                    embeds : [embed],
                    ephemeral : ephemeral
                });
            } else {
                embed = displayQueueViewEmbed(machineStackingData, emojisData, machine, userStackingData, interaction);

                const replyPromise = interaction.reply({
                    embeds : [embed],
                    ephemeral : ephemeral
                });
                const updatePromise = update(usersDataBaseSheetId, "stackingData", 
                [{column : "accountID", value : accountID}], newQueue, machine);
                await Promise.all([replyPromise, updatePromise]);
            }
            cache.del('accountsData')
        }
    }
}