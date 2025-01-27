const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, MessageFlags, Message, ChannelType } = require('discord.js');
require("moment-duration-format");
const Guild = require('../../Schemas/guildSchema')
const { clear_guild_language_cache, getTranslation, colors } = require('../../utils/helper');
const { get } = require('mongoose');

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
            
    async execute(interaction) {
        if (interaction.options.getSubcommand() === 'log_channel') {
            try{
            const guildData = await Guild.findOne({ _id: interaction.guild.id})
            const url = interaction.options.getString('webhook_url')
            console.log(guildData)
            console.log(url)
            if(url) {
                await Guild.updateOne(
                    { _id: interaction.guild.id},
                    { $set: {logchannel: url}}
                )
            if(url == guildData.logchannel) {
                await interaction.reply({ content: await getTranslation(interaction.guild.id, "setup_logchannel_webhoook_isthesame"), flags: MessageFlags.Ephemeral})
                return
            }
                const SuccessfullEmbed = new EmbedBuilder()
                    .setColor(0xAEFFD8)
                    .setThumbnail(interaction.guild.iconURL({dynamic: true, size: 1024}))
                    .setTitle(await getTranslation(interaction.guild.id, "setup_successful"))
                    .setDescription(await getTranslation(interaction.guild.id, "setup_logchannel_changed"))
                await interaction.reply({ embeds: [SuccessfullEmbed], flags: MessageFlags.Ephemeral})
            }
        }catch(error) {
            await interaction.reply(await getTranslation(interaction.guild.id, "main_error_message"))
            return
        }
            
        }
        if (interaction.options.getSubcommand() === 'whitelist') {
            try{
                const role = interaction.options.getRole('role')

                let guildData = await Guild.findOne({ _id: interaction.guild.id} )
                console.log(guildData)
                if(!guildData) {
                    guildData = new Guild({ _id: interaction.guild.id})
                    await guildData.save()
                }
                if (!guildData.whitelist.includes(role.id)) {

                    guildData.whitelist.push(role.id); 
                    await guildData.save(); 
                    const SuccessfullEmbed = new EmbedBuilder()
                        .setColor(color.SUCCESSFUL_COLOR)
                        .setThumbnail(interaction.guild.iconURL({dynamic: true, size: 1024}))
                        .setTitle(await getTranslation(interaction.guild.id, "setup_successful"))
                        .setDescription(await getTranslation(interaction.guild.id, "setup_whitelist_changed", {role}))
                    await interaction.reply({ embeds: [SuccessfullEmbed], flags: MessageFlags.Ephemeral})
                } else {
                    await interaction.reply(await getTranslation(interaction.guild.id, "setup_whitelist_already_is"));
                }
            }catch(error) {
                await interaction.reply(await getTranslation(interaction.guild.id, "main_error_message"))
                return
            }
        }
        if (interaction.options.getSubcommand() === 'language') {

            try{
                const lang = interaction.options.getString('set_language_option')
                let guildData = await Guild.findOne({ _id: interaction.guild.id} )
                console.log(guildData)

                if(!guildData) {
                    guildData = new Guild({ _id: interaction.guild.id})
                    await guildData.save()
                }
                await Guild.updateOne(
                    { _id: interaction.guild.id},
                    { $set: {language: lang}}
                )
                clear_guild_language_cache(interaction.guild.id)
                const SuccessfullEmbed = new EmbedBuilder()
                        .setColor(color.SUCCESSFUL_COLOR)
                        .setThumbnail(interaction.guild.iconURL({dynamic: true, size: 1024}))
                        .setTitle(await getTranslation(interaction.guild.id, "setup_successful"))
                        .setDescription(await getTranslation(interaction.guild.id, "setup_language_changed", {lang}))
                    await interaction.reply({ embeds: [SuccessfullEmbed], flags: MessageFlags.Ephemeral})

            }catch(error) {
                await interaction.reply(await getTranslation(interaction.guild.id, "main_error_message"))
                return
            }
        }

        if (interaction.options.getSubcommand() === 'ban_users') {
            try{
                const choice = interaction.options.getString('ban_users_option')
                const guildData = await Guild.findOne({ _id: interaction.guild.id})
                const isChoiceTrue = choice === 'true'

                if(guildData.blocking_enabled === isChoiceTrue) { // Перевірка, чи було введено той самий параметр, який вже встановлений на сервері
                    await interaction.reply(await getTranslation(interaction.guild.id, "setup_banusers_isthesame"))
                    return
                }
                if(choice==='true') {
                    try{
                        await Guild.updateOne(
                            { _id: interaction.guild.id },
                            { $set: { blocking_enabled: true } }
                        );
                        const SuccessfullEmbed = new EmbedBuilder()
                            .setColor(colors.SUCCESSFUL_COLOR)
                            .setThumbnail(interaction.guild.iconURL({dynamic: true, size: 1024}))
                            .setTitle(await getTranslation(interaction.guild.id, "setup_successful"))
                            .setDescription(await getTranslation(interaction.guild.id, "setup_banusers_enabled"))
                        await interaction.reply({ embeds: [SuccessfullEmbed], flags: MessageFlags.Ephemeral})
                    }catch(error) {
                        console.log(error)
                    }
                }else if(choice==='false') {
                    try{
                        await Guild.updateOne(
                            { _id: interaction.guild.id },
                            { $set: { blocking_enabled: false } }
                        );
                        const SuccessfullEmbed = new EmbedBuilder()
                            .setColor(colors.SUCCESSFUL_COLOR)
                            .setThumbnail(interaction.guild.iconURL({dynamic: true, size: 1024}))
                            .setTitle(await getTranslation(interaction.guild.id, "setup_successful"))
                            .setDescription(await getTranslation(interaction.guild.id, "setup_banusers_disabled"))
                        await interaction.reply({ embeds: [SuccessfullEmbed], flags: MessageFlags.Ephemeral})
                    }catch(error) {
                        console.log(error)
                    }
                }
                
            }catch(error) {
                console.log(error)
            }
        }

    

    }
}