const express = require('express');
const ip = require('ip');
const app = express();
require('dotenv').config();
const telegramBot = require('node-telegram-bot-api');
const bot = new telegramBot(process.env.TELEGRAM_TOKEN, {polling: true});
bot.sendMessage(process.env.TELEGRAM_CHAT_ID, `Новий користувач!`);
const PORT = process.env.PORT || 3000;
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    console.log(ip.address());
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});