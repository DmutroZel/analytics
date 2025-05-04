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


const BLOCKED_COUNTRIES = ['RU', 'CN'];


const isLocalIp = (ip) => {
    return ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.');
};

const logUserInfo = async (req, res, next) => {

    let ip = (req.headers['x-forwarded-for'] || '').split(',')[0] || req.connection.remoteAddress;
    

    if (ip.startsWith('::ffff:')) {
        ip = ip.replace('::ffff:', '');
    }

    const userAgent = req.headers['user-agent'];
    const today = new Date().toDateString();

    console.log(`IP: ${ip}`);


    if (isLocalIp(ip)) {
        const logMessage = `🔔 Локальний запит!\nIP: ${ip}\nUser-Agent: ${userAgent}\nДата: ${today}`;
        console.log(logMessage);
        bot.sendMessage(CHAT_ID, logMessage);
        next();
        return;
    }

    try {
  
        const geoResponse = await axios.get(`https://ipapi.co/${ip}/json/`);
        console.log('API Response:', geoResponse.data);

       

        const countryCode = geoResponse.data.country_code || 'Невідома країна';

    
        const logMessage = `🔔 Новий користувач!\nIP: ${ip}\nКраїна: ${countryCode}\nUser-Agent: ${userAgent}\nДата: ${today}`;
        console.log(logMessage);
        bot.sendMessage(CHAT_ID, logMessage);

       
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