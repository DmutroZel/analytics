// const express = require('express');
// const ip = require('ip');
// const app = express();
// require('dotenv').config();
// const telegramBot = require('node-telegram-bot-api');
// const bot = new telegramBot(process.env.TELEGRAM_TOKEN, {polling: true});
// bot.sendMessage(process.env.TELEGRAM_CHAT_ID, `Новий користувач!`);
// const PORT = process.env.PORT || 3000;
// const path = require('path');

// app.use(express.static(path.join(__dirname, 'public')));
// app.get('/', (req, res) => {
//     console.log(ip.address());
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
  
// });


// app.listen(PORT, () => {
//   console.log(`Server is running on http://localhost:${PORT}`);
// });

const express = require('express');
const path = require('path');
const telegramBot = require('node-telegram-bot-api');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const bot = new telegramBot(process.env.TELEGRAM_TOKEN, { polling: true });
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Список заборонених країн (можна змінити)
const BLOCKED_COUNTRIES = ['RU', 'CN'];

// Перевірка, чи є IP локальним
const isLocalIp = (ip) => {
    return ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.');
};

const logUserInfo = async (req, res, next) => {
    // Отримання першої IP-адреси зі списку
    let ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;
    
    // Видалення префіксу ::ffff: для IPv4-адрес у IPv6-форматі
    if (ip.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '');
    }

    const userAgent = req.headers['user-agent'];
    const today = new Date().toDateString();

    console.log(`IP: ${ip}`);

    // Якщо IP локальна, пропускаємо геолокацію
    if (isLocalIp(ip)) {
        const logMessage = `🔔 Локальний запит!\nIP: ${ip}\nUser-Agent: ${userAgent}\nДата: ${today}`;
        console.log(logMessage);
        bot.sendMessage(CHAT_ID, logMessage);
        next();
        return;
    }

    try {
        // Запит до ipapi.co
        const geoResponse = await axios.get(`https://ipapi.co/${ip}/json/`);
        console.log('API Response:', geoResponse.data);

        // Перевірка на помилку API
        if (geoResponse.data.error) {
            console.error('API Error:', geoResponse.data.reason);
            bot.sendMessage(CHAT_ID, `⚠️ Помилка API для IP: ${ip}\nПричина: ${geoResponse.data.reason}`);
            next();
            return;
        }

        const countryCode = geoResponse.data.country_code || 'Невідома країна';

        // Логування інформації
        const logMessage = `🔔 Новий користувач!\nIP: ${ip}\nКраїна: ${countryCode}\nUser-Agent: ${userAgent}\nДата: ${today}`;
        console.log(logMessage);
        bot.sendMessage(CHAT_ID, logMessage);

        // Перевірка, чи країна в списку заборонених
        if (BLOCKED_COUNTRIES.includes(countryCode)) {
            res.status(403).send('Доступ заборонено для вашої країни.');
            bot.sendMessage(CHAT_ID, `🚫 Доступ заблоковано для IP: ${ip} (Країна: ${countryCode})`);
            return;
        }
    } catch (error) {
        console.error('Помилка при отриманні геолокації:', error.message);
        bot.sendMessage(CHAT_ID, `⚠️ Помилка геолокації для IP: ${ip}\nПомилка: ${error.message}`);
        next();
    }

    next();
};

app.use(logUserInfo);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Сервер запущено на http://localhost:${PORT}`);
    bot.sendMessage(CHAT_ID, `✅ Сервер запущено на порту ${PORT}`);
});