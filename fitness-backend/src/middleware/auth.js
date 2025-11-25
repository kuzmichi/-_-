// src/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me'; 

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token == null) {
        return res.status(401).json({ success: false, message: 'Доступ запрещен. Отсутствует токен аутентификации.' });
    }

    jwt.verify(token, JWT_SECRET, (err, userPayload) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Доступ запрещен. Токен недействителен или просрочен.' });
        }

        req.user = userPayload;

        next();
    });
}

module.exports = authenticateToken;
