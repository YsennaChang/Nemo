const { SlashCommandBuilder, ActionRowBuilder, ComponentType, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, } = require("discord.js");
const { getValues } = require("../functions/getValues");
const { haydayDataBaseSheetId} = require("../utils/variables");
const { botColor } = require("../utils/variables");
const { freeFooter } = require("../messages/footers");

const key = 'help';
const ephemeral = false;

module.exports = {
    data : new SlashCommandBuilder()
        .setName(key)
        .setDescription("Display a help menu with all faq."),

    async execute(interaction){
        const faqData = await getValues(haydayDataBaseSheetId, "help");

        const faqMenuOptions = faqData.map((item, index) => ({
            label : item.label,
            value : item.value,
            description : item.description
        }));
        const select = new StringSelectMenuBuilder()
        .setCustomId('faq')
        .setPlaceholder('Choose your question')
        .addOptions(faqMenuOptions)

        const row = new ActionRowBuilder()
        .addComponents(select);
        
        const selectedQuestion = await interaction.reply({
            content : 'I\'m here to help. Don\'t hesitate to choose your question. I\'ll be happy to anwser',
            ephemeral : ephemeral, 
            components : [row]
        })

        const selectionsCollector = selectedQuestion.createMessageComponentCollector({
            componentType: ComponentType.StringSelect,
                time: 3*60*1000
        })

        selectionsCollector.on('collect', async i => {

            const questionValue = i.values[0];
            const questionData = faqData.filter( question => question.value === questionValue)

            const answers = [];
            const images = [];
            let answerCount = 0;
            for (const key in questionData[0]) {
                if (key.startsWith('answer') && questionData[0][key] !== undefined) {
                    answerCount++;
                }
            }
            for (let j = 1; j <= answerCount; j++) {
                const answer = questionData[0]['answer' + j];
                const gif = questionData[0]['gif' + j];
                answers.push(answer)
                images.push(gif)
            }

            if (answerCount === 1 ) {
                const embed = {
                    type : "rich",
                    title : `${questionData[0].label}`,
                    description : `${answers[0]}`,
                    color : botColor,
                    image : {
                        url: `${images[0]}`,
                        height: 0,
                        width: 0
                    },
                    footer : {
                        text : `This embed showed up after using /help\n${freeFooter}`,
                        icon_url : interaction.guild.iconURL()
                    }
                }

                await i.reply({
                    embeds : [embed],
                    ephemeral : ephemeral
                });
            } else {
                // Paginate the answers
                let currentPage = 0;
                const createEmbed = (currentPage) => {
                    const answer = answers[currentPage]; // Assuming only one answer per page
                    const gif = images[currentPage] ? images[currentPage] : "";
                    const embed = {
                        type: "rich",
                        title: `${questionData[0].label}`,
                        description: `${answer}`,
                        color: botColor,
                        image: {
                            url: `${gif}`,
                            height: 0,
                            width: 0
                        },
                        footer: {
                            text: `This embed showed up after using /help\n${freeFooter}`,
                            icon_url: interaction.guild.iconURL()
                        }
                    };
                    return embed;
                };

                // Send the initial embed
                const initialEmbed = createEmbed(currentPage);

                // Handle pagination
                const MAX_PAGE = answers.length - 1;
                const previousButton = new ButtonBuilder()
                    .setCustomId('previous')
                    .setLabel('Previous')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(true);
                const nextButton = new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next')
                    .setStyle(ButtonStyle.Secondary);
                const actionRow = new ActionRowBuilder()
                    .addComponents(previousButton, nextButton);

                const message = await i.reply({
                    embeds: [initialEmbed],
                    components : [actionRow],
                    ephemeral: ephemeral
                });
                const messageComponentCollector = message.createMessageComponentCollector({ idle: 10*60*1000 });

                messageComponentCollector.on('collect', async (int) => {
                    if (int.user.id !== i.user.id) return;

                    if (int.customId === 'previous') {
                        if (currentPage > 0) {
                            currentPage--;
                            previousButton.setDisabled(currentPage === 0);
                            nextButton.setDisabled(false);
                        }
                    } else if (int.customId === 'next') {
                        if (currentPage < MAX_PAGE) {
                            currentPage++;
                            previousButton.setDisabled(false);
                            nextButton.setDisabled(currentPage === MAX_PAGE);

                        }
                    }
                    await int.update({
                        embeds: [createEmbed(currentPage)],
                        components: [actionRow]
                    });
                });

                messageComponentCollector.on('end', async (collected, reason) => {
                    if (reason === 'time') {
                        await interaction.followUp({
                            content: 'Time to respond is expired (10min), please redo `/help` to continue the process.',
                            ephemeral: true
                        });
                    }
                });
            }
            await selectedQuestion.delete()
        });

        selectionsCollector.on('end', async (collected, reason) => {
            if (reason === 'time') {
                await interaction.followUp({
                    content : 'Time to respond is expired (3min), please, redo `/help` if you need to see the select menu again.',
                    ephemeral : true
                });
                await selectedQuestion.delete()
            }
        })

    }

}