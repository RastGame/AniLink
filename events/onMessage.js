const { Events, Collection, REST, Routes, EmbedBuilder, WebhookClient } = require('discord.js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const Guild = require('../Schemas/guildSchema')
const User = require('../Schemas/userSchema')
module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        try{
            const userData = User.findOne({ _id: message.author.id})
            const isRole = await check_whitelist_and_owner(message)
            const user_id = message.author.id
            const channel_name = message.channel.name
            console.log(`isRole: ${isRole}`)

            const is_blocking_enabled = await check_blocking(message)
            console.log(`is_blocking_enabled: ${is_blocking_enabled}`)
            
            if(isRole!=true && is_blocking_enabled==true && !message.author.bot) {
                console.log('Контент' + message.content)
                const regex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li|club)|discord(app)?\.com\/invite)\/\S+/i;
                console.log(userData.warns)
                const isMessageLink = regex.test(message.content) 
                console.log(isMessageLink)
                if(isMessageLink == true) {
                    
                    await User.updateOne(
                        { _id: user_id },  // Пошук за id користувача
                        {
                          $inc: { warns: 1 },  // Збільшення попереджень
                          $push: {  // Додавання нової причини в масив reasons
                            reasons: {
                              author_id: 'BOT',
                              reason: "[Auto] links",
                              proofs: null
                            }
                          }
                        },
                        { upsert: true }  // Якщо не знайдено, створює новий документ
                      );
                    
                    const ExampleEmbed = new EmbedBuilder()

                    .setColor(0xE53935)
                    .setTitle(`❌Посилання заблоковано`)
                    .setDescription('На даній гільдії заборонено використовувати запрошувальні посилання')
                
                    
                
                    try{
                        await message.delete().then(message => {
                            message.channel.send({ content: `<@${message.author.id}>`,embeds: [ExampleEmbed]})
                            send_to_guild_logschannel(message, user_id, channel_name )
                        })
                    }catch(error) {
                        console.log('Не вдалось видалити повідомлення')
                    }
                }
            }
                
            
        
    }catch(error) {
        console.log(error)
    }
}
}
async function check_whitelist_and_owner(message) {
    try {
        const guildData = await Guild.findOne({ _id: message.guild.id }); // Отримуємо дані гільдії
        const whitelist_data = guildData ? guildData.whitelist : []; // whitelist з бази даних, перевіряємо на null
        const member = message.member; // Отримуємо учасника, що надіслав повідомлення

        if (!member) {
            console.log('Не вдалося отримати учасника!');
            return; // Якщо member відсутній, припиняємо виконання
        }

        // Виведення ролей користувача
        const memberRoles = member.roles.cache; // Використовуємо cache без fetch()

        console.log('Ролі користувача:');
        memberRoles.forEach(role => {
            console.log(`- ${role.name} (ID: ${role.id})`); // Виведемо кожну роль
        });

        // Перевірка, чи є роль користувача в whitelist
        const hasWhitelistedRole = memberRoles.some(role => whitelist_data.includes(role.id));

        if (hasWhitelistedRole) {
            console.log('Користувач має роль, яка є у whitelist');
            return true
        } else {
            console.log('Користувач не має ролі з whitelist');
            return false
        }

    } catch (error) {
        console.error('Сталася помилка:', error);
    }
}
async function check_blocking(message) {
    try {
        const guildData = await Guild.findOne({ _id: message.guild.id }); // Отримуємо дані гільдії
        const blockingData = guildData ? guildData.blocking_enabled: false;
        if(blockingData==true) {
            console.log('Блокування ввімкнено на сервері')
            return true
        }else if(blockingData==false) {
            console.log('Блокування вимкнено')
            return false
        }
    }catch(error) {
        console.log('check_block error: '+ error)
    }
}

async function send_to_guild_logschannel(message, user_id, channel_name) {
    guildData = await Guild.findOne({ _id: message.guild.id})
    guild_logchannel = guildData.logchannel
    console.log(guild_logchannel)
    if(guild_logchannel) {
    const webhook = new WebhookClient({ url: guild_logchannel})
    const log_embed = new EmbedBuilder()
        .setTitle('Блокування запрошення')
        .setColor(0x5e66ff)
        .addFields(
            { name: `Користувач`, value: `<@${user_id}> || \`\`${user_id}\`\`` , inline: true },
            { name: `Канал`, value: `${channel_name}`, inline: true },
            { name: 'Повідомлення', value: `\`\`${message}\`\``, inline: false },
            // { name: 'Розробник', value: `Maksym_Tyvoniuk`, inline: false }
        )
    
    await webhook.send({ embeds: [log_embed]})
    }
}