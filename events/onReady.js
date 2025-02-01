const { Events, Collection, REST, Routes, PresenceUpdateStatus} = require('discord.js');
const path = require('path');
const fs = require('fs');
const { memoryUsage } = require('process');
const { type } = require('os');
require('dotenv').config();
const token = process.env.TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        client.commands = new Collection()
        const foldersPath = path.join(__dirname, '..', 'commands');

        // Рекурсивна функція для збору всіх команд
        async function loadCommands(folderPath) {
            const entries = fs.readdirSync(folderPath, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(folderPath, entry.name);

                // Якщо це папка, запускаємо рекурсію
                if (entry.isDirectory()) {
                    await loadCommands(fullPath);
                } else if (entry.isFile() && entry.name.endsWith('.js')) {
                    // Якщо це файл команди, підключаємо його
                    const command = require(fullPath);
                    if ('data' in command && 'execute' in command) {
                        client.commands.set(command.data.name, command);
                        console.log(`Команда ${command.data.name} завантажена з файлу ${fullPath}`);
                    } else {
                        console.log(`[WARNING] The command at ${fullPath} is missing a required "data" or "execute" property.`);
                    }
                }
            }
        };

        // Запускаємо рекурсивний обхід команд
        await loadCommands(foldersPath);

        console.log('Усі команди успішно завантажені!');

        // Реєстрація команд на сервері
        const commands = client.commands.map(command => command.data.toJSON());

        const rest = new REST({ version: '10' }).setToken(token);

        try {
            console.log('Реєстрація команд...');

            // Реєстрація локальних команд на гільдії
            await rest.put(
                Routes.applicationCommands(clientId), // <- замість applicationGuildCommands
                { body: commands },
            );
            console.log('Локальні команди успішно зареєстровані!');

        } catch (error) {
            console.error('Помилка при реєстрації команд:', error);
        }
    },
};
