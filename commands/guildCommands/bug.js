const { EmbedBuilder, SlashCommandBuilder, WebhookClient, ModalBuilder, ActionRowBuilder ,TextInputBuilder, TextInputStyle} = require('discord.js')
const { send_webhook } = require('../../utils/sendBugReport')
require('dotenv')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('bug')
        .setDescription('Відправляє знайдений вами баг розробнику'),

    async execute(interaction) {
        try{

            const modal = new ModalBuilder()
                .setCustomId('bug_report')
                .setTitle('Відправлення багу')

            const bug_input = new TextInputBuilder()
                .setCustomId('bug_input')
                .setLabel('Будь ласка, опишіть баг який Ви знайшли')
                .setMinLength(10)
                .setStyle(TextInputStyle.Paragraph)

            // const row_one = new ActionRowBuilder().addComponents(modal)
            const row_two = new ActionRowBuilder().addComponents(bug_input)

            modal.addComponents(row_two)

            await interaction.showModal(modal)
            
            
            // await send_webhook(interaction, bug_text)

    
        }catch(error) {
            console.log('bug error: '+error)
        }
    }
    
}