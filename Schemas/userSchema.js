const mongoose = require('mongoose');

// Створення схеми для користувача
const userSchema = new mongoose.Schema({
    _id: {
        type: String,
        required: true,
        unique: true,
    },
    warns: {
        type: Number,
        default: 0,
    },
    reasons: [{
        author_id: {
            type: String,
            required: true,
        },
        reason: {
            type: String,
            required: true,
        },
        proofs: {
            type: String
        }
    }],
}, { collection: 'collusers' });  // Вказуємо колекцію вручну

const User = mongoose.model('User', userSchema);

module.exports = User;

// Запит до колекції
async function checkUserWarnings(userId) {
    console.log(`Перевіряю попередження для користувача з ID: ${userId}`);

    try {
        // Лог перед запитом
        const userWarnings = await User.findOne({ _id: userId });
        
        // Лог після запиту
        console.log('Попередження знайдено:', userWarnings);

        if (!userWarnings) {
            console.log(`Користувач з ID ${userId} не знайдений в колекції.`);
        } else {
            console.log(`Користувач з ID ${userId} має попередження:`, userWarnings.warns);
        }
    } catch (error) {
        console.error('Помилка при перевірці попереджень:', error);
    }
}
