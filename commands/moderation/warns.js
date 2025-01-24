const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Warning = require('../../Schemas/userSchema'); // Шлях до схеми попереджень

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warns')
    .setDescription('Команда для перевірки попереджень користувача')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('ID користувача для перевірки')
        .setRequired(true)
    ),

  async execute(interaction) {
    let userId = interaction.options.getString('user_id'); // Отримуємо ID користувача як рядок
    console.log(`Айді, який перевіряю: ${userId}`);

    // Перевірка, чи є це число
    if (isNaN(userId)) {
      return interaction.reply({
        content: 'Будь ласка, введіть валідний числовий ID.',
        ephemeral: true,
      });
    }

    // Конвертація ID в число
    const userIdNumber = userId;

    // Перевірка на валідність числа
    if (isNaN(userIdNumber)) {
      return interaction.reply({
        content: 'ID повинно бути валідним числом.',
        ephemeral: true,
      });
    }

    try {
      // Шукаємо попередження для цього користувача в базі даних
      console.log(`Запит в базу:id: ${userIdNumber}`);
      const userWarnings = await Warning.findOne({ _id: userIdNumber });

      const noWarnsEmbed = new EmbedBuilder()
        .setColor('#4CAF50') // Червоний колір для попереджень
        .setTitle(`Попередження для ${userId}`)
        .addFields({
          name: 'Попередження:',
          value: 'Попереджень немає в базі даних.'
        })
        .setTimestamp();

      // Перевірка, чи є попередження
      if (!userWarnings) {
        return interaction.reply({ embeds: [noWarnsEmbed] });
      }
      // Якщо попередження є, створюємо Embed для відображення
      const embed = new EmbedBuilder()
        .setColor('#FF0000') // Червоний колір для попереджень
        .setTitle(`Попередження для ${userId}`)
        .addFields({
          name: 'Попередження:',
          value: userWarnings.reasons.map(r => `Автор: ${r.author_id}, Причина: ${r.reason}`).join('\n') || 'Немає попереджень',
        })
        .setTimestamp();
        
      // Відправляємо Embed відповідь користувачу
      return interaction.reply({ embeds: [embed] });

    } catch (error) {
      console.error('Помилка при отриманні попереджень:', error);
      return interaction.reply({
        content: 'Сталася помилка при отриманні ваших попереджень.',
        ephemeral: true,
      });
    }
  },
};
