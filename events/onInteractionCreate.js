const { Events, MessageFlags, EmbedBuilder, Embed, ButtonBuilder, ButtonStyle, ActionRowBuilder, PermissionOverwriteManager, PermissionOverwrites, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle, flatten } = require('discord.js');
require('dotenv').config();
const { send_webhook } = require('../utils/sendBugReport');
const { colors } = require('../utils/helper');
const { settingsHandler } = require('../utils/settingsHandler');
module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction) {
		if (interaction.isAutocomplete()) {
			try{
				const command = interaction.client.commands.get(interaction.commandName);
				await command.autocomplete(interaction);
				return; 
			}catch(error) {
				console.log(error)
			}
		}	
		const { emoji_pack } = await settingsHandler(interaction)
		if(interaction.isModalSubmit()) {
			try{
				if(interaction.customId === 'bug_report') {
					const bug_text = await interaction.fields.getTextInputValue('bug_input')
					await send_webhook(interaction, bug_text)
				}
			}catch(error) {
				console.log(error)
			}
			
		}
		if (interaction.isChatInputCommand()) {	
			if (!interaction.inGuild() || !interaction.isCommand()) return;

			const command = interaction.client.commands.get(interaction.commandName);
			if (!command) {
				console.error(`No command matching ${interaction.commandName} was found.`);
				return;
			}
			
			try {

				await command.execute(interaction);
	
			} catch (error) {
				console.error(error);
				if (interaction.replied || interaction.deferred) {
					await interaction.followUp({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
				} else {
					await interaction.reply({ content: 'There was an error while executing this command!', flags: MessageFlags.Ephemeral });
				}
			}
		}
	}
	}
	