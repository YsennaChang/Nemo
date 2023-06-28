const { masteryTasksFooter, freeFooter } = require("../messages/footers");
const { botColor, emojiXP, excludedProductionTask} = require('../utils/variables');
const {convertInHour} = require("./convertInHour");

exports.generateField = (name, value, inline) => ({name, value, inline});

exports.generateListOfQueue = (productsInQueue, emojisData ) => {
    let listOfQueue = '';
    let currentProduct = null;
    let count = 0;
    for (const product of productsInQueue) {
        if (product !== currentProduct) {
            if (currentProduct) {
                const productEmoji = emojisData.find(prod => prod.enName === currentProduct)?.emoji || "";
                listOfQueue += `${productEmoji} x **${count}**, `;
            }
            currentProduct = product;
            count = 1;
        } else {
            count++;
        }
    }
    if (currentProduct) {
        const productEmoji = emojisData.find(prod => prod.enName === currentProduct).emoji;
        listOfQueue += `${productEmoji} x **${count}**`
    }

    return listOfQueue;
};

const generateListOfProducts = (filteredProductsOfSelectedMachine, emojisData, productsInQueue) => {
    let listOfProducts = "";
    for ( let index = 0; index < filteredProductsOfSelectedMachine.length; index++){
        const product = filteredProductsOfSelectedMachine[index]
        
        const productEmoji = emojisData.find(prod => prod.enName === product).emoji;
        const occurences = productsInQueue.filter( prod => prod === product).length;
        listOfProducts += `${productEmoji} x **${occurences}**`
        if (index < filteredProductsOfSelectedMachine.length - 1) {
            listOfProducts += ", ";
        }
    }
    return listOfProducts;
}

const generateListOfTasks = (tasksToDisplay, emojisData, userStackingData) => {

    const taskFields = []
    for (const task of tasksToDisplay) {
        let listOfCompo = "";
        const qtysStandard = Object.entries(task)
        .filter(([key, value]) => key.startsWith('Qty'+ 'Standard'))
        .map(([key, value]) => value);
        const qtysHalf = Object.entries(task)
        .filter(([key, value]) => key.startsWith('Qty'+ 'Half'))
        .map(([key, value]) => value);

        const compos = task.Compo.split(", ");
        let allComponentsReachQty = true;
        for (let index = 0; index < compos.length; index++) {

            const {emoji : productEmoji, productionMachine : compoMachine, mastery : durationMastered, duration : durationStandard, enName} = emojisData.find(prod => prod.enName === compos[index]);

            const machinesData = Object.keys(userStackingData[0]).filter(key => key.includes(compoMachine)).map(key => userStackingData[0][key]);

            const productsStacked = machinesData.join(', ');
            const productsStackedArray = productsStacked ? productsStacked.split(", ") : [];
            const occurences = productsStackedArray.filter( prod => prod === compos[index]).length;
            
            const masteredMachines = userStackingData[0].mastery ? userStackingData[0].mastery.split(", ") : [];

            const applyMastery = masteredMachines.includes(compoMachine)                    
            const duration = applyMastery ? durationMastered : durationStandard;
            const masteredSign = applyMastery ? "⭐" : "";
            
            const standardDuration = duration ? ` (${masteredSign}${convertInHour(duration*qtysStandard[index])})`: "";
            const masteredDuration = duration ? ` (${masteredSign}${convertInHour(duration*qtysHalf[index])})` : "";

            if (occurences < qtysStandard[index] && !excludedProductionTask.includes(enName)){
                allComponentsReachQty = false;
            }

            listOfCompo += `> ${productEmoji} x **${occurences}**/*${qtysStandard[index]}*${standardDuration}\n> ||💪**${occurences}**/${qtysHalf[index]} ${masteredDuration}||`
            if (index < compos.length - 1) {
                listOfCompo += "\n";
            }
        }

        const checkEmoji = allComponentsReachQty ? " ✅" : "";

        const taskField = exports.generateField(`${task.taskEmoji} **${task.enTaskName}** ${checkEmoji}`,`${listOfCompo}`, true)
        taskFields.push(taskField);
    }
    return taskFields;
}

exports.displayQueueViewEmbed = (productsInQueue, emojisData, machine, userStackingData, interaction) => {
    const listOfQueue = exports.generateListOfQueue(productsInQueue, emojisData).length > 0 ? exports.generateListOfQueue(productsInQueue, emojisData) : "No entry yet";
    const allFields = [exports.generateField (`❖ Queuing`, `> ${listOfQueue}`, false)];

    const machinePNG = emojisData.find(mach => mach.enName === machine).pngURL;

    return embed = {
        type : "rich",
        title : `Informations about :\nThe ${machine} on ${userStackingData[0].accountName}${emojiXP}${userStackingData[0].accountLvL}`,
        fields : allFields,
        thumbnail: {
            url: machinePNG
        },
        color : botColor,
        footer : {
            text : freeFooter,
            icon_url : interaction.guild.iconURL()
        }
    }

}

exports.displayMachineViewEmbed = (productsInQueue, emojisData, filteredProductsOfSelectedMachine, derbyTasksSettings, userStackingData, accountLvL, machine, interaction) => {
    
    const listOfQueue = exports.generateListOfQueue(productsInQueue, emojisData).length > 0 ? exports.generateListOfQueue(productsInQueue, emojisData) : "No entry yet";
    const listOfProducts = generateListOfProducts(filteredProductsOfSelectedMachine, emojisData, productsInQueue)
    
    const tasksToDisplay = derbyTasksSettings.filter(task => 
        task.Compo.split(', ').some(compo => 
            parseInt(task.LvL) <= parseInt(accountLvL) &&
            filteredProductsOfSelectedMachine.includes(compo)
        )
    );
    const taskFields = generateListOfTasks(tasksToDisplay, emojisData, userStackingData)

    const firstFields = [ 
        exports.generateField (`❖ Queuing`, `> ${listOfQueue}`, false),
        exports.generateField (`❖ Summary (${productsInQueue.length}/50)`, `> ${listOfProducts}`, false),
        exports.generateField (`❖ Derby Tasks :`, `/*Standard* (Total Duration) ||💪 /*Power* (Total Duration)||`, false),
        ];

    const allFields = firstFields.concat(taskFields)
    
    const machinePNG = emojisData.find(mach => mach.enName === machine).pngURL;

    return embed = {
        type : "rich",
        title : `Informations about :\nThe ${machine} on ${userStackingData[0].accountName}${emojiXP}${userStackingData[0].accountLvL}`,
        fields : allFields,
        thumbnail: {
            url: machinePNG
        },
        color : botColor,
        footer : {
            text : masteryTasksFooter,
            icon_url : interaction.guild.iconURL()
        }
    }
}