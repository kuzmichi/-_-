// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./src/db');
const apiRouter = require('./src/routes/api');

dotenv.config();

const app  = express();
const port = process.env.SERVER_PORT || 5000

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Fitness Center API запущен!');
});

app.use('/api', apiRouter);

async function startServer() {
    try {
        await db.initialize();

        app.listen(port, () => {
            console.log(`Сервер запущен на порту ${port}`);
        });
    } catch (err) {
        console.error('Ошибка при запуске приложения:', err);
        process.exit(1);
    }
}

process.on('SIGINT', async () => {
    console.log('\n Получен сигнал SIGINT. Закрытие ресурсов...');
    await db.close();
    process.exit(0);
});

startServer();