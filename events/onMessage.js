const { Events, Collection, REST, Routes, EmbedBuilder, WebhookClient } = require('discord.js');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const Guild = require('../Schemas/guildSchema')
const User = require('../Schemas/userSchema')
const { sendBanMessage, canBotBanMember} = require('../utils/sendDmMessages')
const { guild_link_delete_log, guild_ban_log } = require('../utils/guildLogs')
const { getTranslation } = require('../utils/helper')
const { banLogs, linkLogs } = require('../utils/devLogs')
module.exports = {
    name: Events.MessageCreate,

    async execute(message) {
        try{
            const guild = message.guild
            const isRole = await check_whitelist_and_owner(message)
            const user_id = message.author.id
            const channel_name = message.channel.name
            console.log(`isRole: ${isRole}`)

            const is_blocking_enabled = await check_blocking(message)
            console.log(`is_blocking_enabled: ${is_blocking_enabled}`)
            
            if(isRole!=true && is_blocking_enabled==true && !message.author.bot && message.author.id != message.guild.ownerId) {
                const userData = await User.findOne({ _id: message.author.id})
                if(!userData) {
                    return
                }else if(userData) {

                
                if(userData.warns >= 3) {
                    const member = message.guild.members.cache.get(message.author.id)
                    const warnsCount = userData.warns
                    const botMember = message.guild.members.cache.get(message.client.user.id)
                    const canBan = await canBotBanMember(botMember, member) // Перевірка, чи може бот заблокувати людину(наявність прав і позиція ролі)
                    if(canBan) {
                        try{
                            
                            const user = member.user
                            
                            await sendBanMessage(user, guild)
                            await member.ban()
                            await guild_ban_log(message, user_id, channel_name)
                            await banLogs(message, user, guild, warnsCount)
                            
                        }catch(error) {
                            console.log(console.log(error))
                            try{ 
                                await member.ban()
                            }catch(error) {
                                console.log(error)
                            }
                        }
                    }else {
                        console.log('[canBan]не можу заблокувати користувача')
                        return
                    }
                }
            }

                const regex = /(https?:\/\/)?(www\.)?(discord\.(gg|io|me|li|club)|discord(app)?\.com\/invite)\/\S+/i;
                const isMessageLink = regex.test(message.content) 
                if(isMessageLink == true) {
                    
                    await User.updateOne(
                        { _id: user_id },  
                        {
                          $inc: { warns: 1 },  
                          $push: { 
                            reasons: {
                              author_id: 'BOT',
                              reason: "[Auto]links",
                              proofs: null
                            }
                          }
                        },
                        { upsert: true }  
                      );
                    
                    const ExampleEmbed = new EmbedBuilder()

                    .setColor(0xE53935)
                    .setTitle(await getTranslation(guild.id, "no_link_title"))
                    .setDescription(await getTranslation(guild.id, "no_links_description"))
                
                    try{
                        await message.delete().then(message => {
                            message.channel.send({ content: `<@${message.author.id}>`,embeds: [ExampleEmbed]}).then(message => {
                                setTimeout(() => {
                                    message.delete().catch(console.error);
                                }, 10000);
                            })
                            guild_link_delete_log(message, user_id, channel_name )
                        })
                        await linkLogs(message, user, guild, warnsCount)
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
        const guildData = await Guild.findOne({ _id: message.guild.id });
        const whitelist_data = guildData ? guildData.whitelist : []; 
        const member = message.member; 

        if (!member) {
            console.log('Не вдалося отримати учасника!');
            return; 
        }

        const memberRoles = member.roles.cache

        console.log('Ролі користувача:');
        memberRoles.forEach(role => {
            console.log(`- ${role.name} (ID: ${role.id})`)
        });

 
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
        const guildData = await Guild.findOne({ _id: message.guild.id }); 
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

