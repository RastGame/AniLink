const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const Warning = require('../../Schemas/userSchema'); // Шлях до схеми попереджень

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Команда для видачі попередження користувачу')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('Користувач якому видається попередження')
        .setRequired(true)
        
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Причина попередження')
        .setRequired(true)
        .addChoices(
          { name: '⚠ Реклама серверів', value: 'spam links' },
          { name: '🤖 Краш бот', value: 'crash bot' },
          { name: '🧨 Краш серверів', value: 'crashing guild' },
          { name: '🛠 Розробка/реклама краш софту', value: 'crash bot/crash soft develop' },
          { name: '🧌 Русня', value: 'russian' }
        )
    )
    .addStringOption(option =>
        option.setName('proofs')
          .setDescription('Докази порушення')
          .setRequired(true)
      ),
    

  async execute(interaction) {
    if(interaction.user.id != "558945911980556288") return
    let target = interaction.options.getString('user_id');

    // Знаходимо запис у базі даних або створюємо новий
    let targetWarns = await Warning.findOne({ _id: target });
    if (!targetWarns) {
      targetWarns = new Warning({ _id: target, warns: 0 }); // Ініціалізуємо кількість попереджень
    }


    const reason = interaction.options.getString('reason')
    // Додаємо попередження
    targetWarns.warns += 1;
    targetWarns.reasons.push({
      author_id: interaction.user.id,
      reason: reason,
      proofs: interaction.options.getString('proofs') // Докази
    })
    // Зберігаємо зміни
    await targetWarns.save();

    // Відповідаємо користувачеві
    await interaction.reply(`Попередження видано успішно! Загальна кількість попереджень: ${targetWarns.warns}`);
  },
};
