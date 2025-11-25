// src/db.js
const oracledb = require('oracledb');
require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING, // ВАЖНО: проверьте, что тут именно connectString (без 'ion'), в вашем коде было connectionString, стандартный параметр oracledb именно connectString, хотя некоторые версии драйвера прощают эту опечатку.
    poolMin: 2, // Рекомендуется держать минимум несколько открытых соединений
    poolMax: 10,
    poolIncrement: 1
};

// Переменная для хранения объекта пула
let pool;

async function initialize() {
    try {
        // Если пул уже существует, не создаем новый (защита от двойной инициализации)
        if (pool) {
            console.warn('Oracle Connection Pool уже инициализирован.');
            return;
        }

        oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
        // Сохраняем созданный пул в переменную
        pool = await oracledb.createPool(dbConfig);
        console.log('Oracle Connection Pool успешно запущен!');
    } catch(err) {
        console.error('Ошибка запуска Oracle Connection Pool', err);
        process.exit(1);
    }    
}

async function close() {
    try {
        // Проверяем, есть ли пул, перед закрытием
        if (pool) {
            await pool.close(10); // 10 секунд на завершение активных транзакций
            pool = null; // Обнуляем переменную после закрытия
            console.log('Oracle Connection Pool закрыт.');
        }
    } catch (err) {
        console.error('Ошибка закрытия пула:', err);
    }
}

async function getConnection() {
    if (!pool) {
        throw new Error('Попытка получить соединение до инициализации пула');
    }
    // Берем соединение конкретно из нашего пула
    return pool.getConnection();
}

module.exports = {
    initialize,
    close,
    getConnection,
    oracledb
};