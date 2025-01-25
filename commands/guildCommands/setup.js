const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, MessageFlags, Message, ChannelType } = require('discord.js');
require("moment-duration-format");
const Guild = require('../../Schemas/guildSchema')
const { clear_guild_language_cache } = require('../../utils/helper')
module.exports = {
    data: new SlashCommandBuilder()
        .setName('setup')
        .setDescription('Змінює налаштування певного параметру у вашій гільдії')
        .addSubcommand(subcommand => 
            subcommand
            .setName('log_channel')
            .setDescription('Призначити канал логів на вашій гільдії')
            .addStringOption(option => 
                option
                .setName('webhook_url')
                .setDescription('Вкажіть посилання webhook, куди будуть відправлятись логи вашого серверу')
                .setRequired(true)
            )
        )
        .addSubcommand(subcommand =>
            subcommand
            .setName("whitelist")
            .setDescription('Додає вказану роль в білий список')
            .addRoleOption(option =>
                option
                .setName('role')
                .setDescription("Вибрана роль буде додана в білий список")
                .setRequired(true)
                
            )
            
        )
        .addSubcommand(subcommand =>
            subcommand
            .setName("ban_users")
            .setDescription('Вмикає на сервері функцію блокування користувачів та запрошень')
            .addStringOption(option =>
                option.setName('ban_users_option')
                    .setDescription('Виберіть параметр')
                    .setRequired(true)
                    .addChoices(
                        { name: 'увімкнути', value: 'true' },
                        { name: 'вимкнути', value: 'false' },

                    )),
        )
        .addSubcommand(subcommand =>
            subcommand
            .setName("language")
            .setDescription('Змінює мову на вашій гільдії')
            .addStringOption(option =>
                option.setName('set_language_option')
                    .setDescription('Виберіть параметр')
                    .setRequired(true)
                    .addChoices(
                        { name: 'українська', value: 'uk' },
                        { name: 'english', value: 'en' },

                    )),
        ),
            

            
        
    // Визначення execute з параметром client
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'log_channel') {
            const guildData = await Guild.findOne({ _id: interaction.guild.id})
            const url = interaction.options.getString('webhook_url')
            console.log(guildData)
            console.log(url)
            if(url) {
                await Guild.updateOne(
                    { _id: interaction.guild.id},
                    { $set: {logchannel: url}}
                )
                await interaction.reply(`Webhook для логів успішно призначено!`)
            }
            
        }
        if (interaction.options.getSubcommand() === 'whitelist') {
            try{
                const role = interaction.options.getRole('role')
                //console.log(role)
                let guildData = await Guild.findOne({ _id: interaction.guild.id} )
                console.log(guildData)
                if(!guildData) {
                    console.log('Не знайдено гільдію, створюю запис')
                    guildData = new Guild({ _id: interaction.guild.id})
                    await guildData.save()
                }
                if (!guildData.whitelist.includes(role.id)) {
                    guildData.whitelist.push(role.id); // Додаємо ID ролі до масиву
                    await guildData.save(); // Зберігаємо зміни в базу даних
                    await interaction.reply(`Роль успішно додано до whitelist: ${role}`);
                } else {
                    await interaction.reply(`Роль вже є у whitelist: ${role}`);
                }
            }catch(error) {
                console.log(error)
            }
        }
        if (interaction.options.getSubcommand() === 'language') {
            try{
                console.log('Команда викликається')
                const lang = interaction.options.getString('set_language_option')
                console.log(`Вибрана мова: `+lang)
                let guildData = await Guild.findOne({ _id: interaction.guild.id} )
                console.log(guildData)
                if(!guildData) {
                    console.log('Не знайдено гільдію, створюю запис')
                    guildData = new Guild({ _id: interaction.guild.id})
                    await guildData.save()
                }
                await Guild.updateOne(
                    { _id: interaction.guild.id},
                    { $set: {language: lang}}
                )
                clear_guild_language_cache(interaction.guild.id)
                await interaction.reply('Успішно змінено мову на ' + lang)
            }catch(error) {
                console.log(error)
            }
        }
        if (interaction.options.getSubcommand() === 'ban_users') {
            let guildData = await Guild.findOne({ _id: interaction.guild.id} )
            const choice= interaction.options.getString('ban_users_option')
            console.log(`Вибір `+choice)
            console.log(guildData.logchannel)
            if(choice==='true') {
                try{
                    console.log('Викликається!')
                    await Guild.updateOne(
                        { _id: interaction.guild.id },
                        { $set: { blocking_enabled: true } }
                    );
                    await interaction.reply(`Успішно ввімкнено!`)
                }catch(error) {
                    console.log(error)
                }
            }
            
        }

    

    }
}