const { EmbedBuilder, WebhookClient, MessageFlags } = require('discord.js')

async function send_webhook(interaction, bug_text) {
    try{
        if(!interaction.customId === 'bug_report') return
        const webhook = new WebhookClient({ url: process.env.BUG_WEBHOOK})
    
        const embed = new EmbedBuilder()
            .setColor(0x5e66ff)
            .setTitle(`Bug-report`)
            .addFields(
                { name: 'Відправник', value: `${interaction.user.displayName} || \`\`${interaction.user.id}\`\``, inline: true },
                { name: 'Текст', value: `${bug_text}`}
            )
            .setTimestamp()
            await webhook.send({ embeds: [embed] })
            await interaction.reply({ content: 'Успішно відправлено!', flags: MessageFlags.Ephemeral})
        }catch(error) {
            console.log('send_webhook error: '+error)
        }
    }
    


module.exports = {
    send_webhook
}