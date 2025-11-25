// src/routes/api.js
const express = require('express');
const db = require('../db');
const { autoCommit, outFormat } = require('oracledb');
const jwt = require('jsonwebtoken'); 
const authenticateToken = require('../middleware/auth');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const router = express.Router();

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_change_me'; 


// Роут 2: Регистрация пользователя, также есть задумка над подтверждением почты
// POST /api/register
router.post('/register', async (req,res) => {
let connection;
try {
    const { username, password, name, surname, secondname, email, phonenumber, role } = req.body;

    const userRole = role || 'Client';

    if (!username || !password || !name || !surname || !email || !phonenumber) {
        return res.status(400).json({ success: false, message: 'Необходимо заполнить все обязательные поля.'});
    };

    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const passwordHash = await bcrypt.hash(password, salt);

    connection = await db.getConnection();
    if (!connection) {
        throw new Error("Не удалось установить соединение с базой данных.");
       };

    const result = await connection.execute(
            `BEGIN FITNESS_API_PKG.REGISTER_USER(
                :p_username, 
                :p_passwordhash, 
                :p_salt, 
                :p_name, 
                :p_surname, 
                :p_secondname,
                :p_email, 
                :p_phonenumber,
                :p_role,
                :p_new_user_id
            ); END;`,
            {
                p_username: username,
                p_passwordhash: passwordHash,
                p_salt: salt,
                p_name: name, 
                p_surname: surname,
                p_secondname: secondname,
                p_email: email,
                p_phonenumber: phonenumber,
                p_role: userRole,
                p_new_user_id: { type: db.oracledb.NUMBER, dir: db.oracledb.BIND_OUT }
            }
        );
        
    const newUserId = result.outBinds.p_new_user_id;

    const verifyToken = crypto.randomBytes(32).toString('hex');

    await connection.execute(
      `BEGIN FITNESS_API_PKG.SET_VERIFY_TOKEN(:p_user_id, :p_token); END;`,
      {
        p_user_id: newUserId,
        p_token: verifyToken
      },
      { autoCommit: true }
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'lifan4753@gmail.com', 
        pass: 'gvpv fytx ikrr mqau' 
      }
    });

    const verifyLink = `http://localhost:5000/api/verify-email?token=${verifyToken}`;

     await transporter.sendMail({
      from: '"Fitness App" <your_email@gmail.com>',
      to: email,
      subject: 'Подтверждение регистрации в Fitness App',
      html: `
        <h2>Здравствуйте, ${name}!</h2>
        <p>Спасибо за регистрацию в Fitness App.</p>
        <p>Для завершения регистрации, пожалуйста, подтвердите ваш email, перейдя по ссылке ниже:</p>
        <a href="${verifyLink}" target="_blank" style="
          display:inline-block;
          background:#10b981;
          color:white;
          padding:10px 20px;
          border-radius:8px;
          text-decoration:none;
          font-weight:bold;
        ">Подтвердить Email</a>
        <p style="margin-top:10px;">Если вы не регистрировались, просто игнорируйте это письмо.</p>
      `
    });

    res.status(201).json({
      success: true,
      message: `Пользователь успешно зарегистрирован! Проверьте вашу почту (${email}) для подтверждения.`,
      id: newUserId
    });

  } catch (err) {
    console.log('Ошибка при создании пользователя:', err);

    if (err.message.includes('ORA-20001')) {
      const userMessage = err.message.replace(/ORA-20001: /, '').split('\n')[0];
      return res.status(400).json({ success: false, message: userMessage });
    }

    if (err.message.includes('ORA-00001')) {
      return res.status(409).json({ success: false, message: 'Пользователь с таким Login или Email уже существует' });
    }

    res.status(500).json({ success: false, message: 'Ошибка сервера при регистрации', error: err.message });
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Токен подтверждения не указан.');

  let connection;
  try {
    connection = await db.getConnection();
    await connection.execute(
      `BEGIN FITNESS_API_PKG.VERIFY_EMAIL(:token); END;`,
      { token },
      { autoCommit: true }
    );

    res.send(`
      <h2>✅ Почта успешно подтверждена!</h2>
      <p>Теперь вы можете войти в систему.</p>
    `);
  } catch (err) {
    console.error('Ошибка подтверждения:', err);
    res.status(500).send('Ошибка сервера при подтверждении почты.');
  } finally {
    if (connection) await connection.close();
  }
});


// Роут 3: Аутентификация пользователя (Логин) (POST) - ПУБЛИЧНЫЙ
// POST /api/login
router.post('/login', async (req, res) => {
    let connection;
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Введите логин и пароль.' });
        }

        connection = await db.getConnection();
        
        // --- 1. Получаем пользователя и статус верификации ---
        const userDetailsResult = await connection.execute(
            `BEGIN :rc := FITNESS_API_PKG.GET_USER_BY_USERNAME(:username); END;`,
            { rc: { dir: db.oracledb.BIND_OUT, type: db.oracledb.CURSOR }, username },
        );
        const userResultSet = userDetailsResult.outBinds.rc;
        const user = await userResultSet.getRow();
        await userResultSet.close(); // <-- Закрываем курсор сразу

        if (!user) {
            return res.status(401).json({ success: false, message: 'Неверный логин или пароль.' });
        }
        
        if (user.IS_VERIFIED === 0) {
            return res.status(403).json({ success: false, message: 'Подтвердите email перед входом.' });
        }
        
        // --- 2. Получаем ДВОЙНОЙ ХЭШ и СОЛЬ для сверки ---
        const hashSaltResult = await connection.execute(
            `BEGIN :rc := FITNESS_API_PKG.GET_HASH_AND_SALT(:username); END;`,
            { rc: { dir: db.oracledb.BIND_OUT, type: db.oracledb.CURSOR }, username }
        );
        const hashSaltResultSet = hashSaltResult.outBinds.rc;
        const hashSalt = await hashSaltResultSet.getRow();
        await hashSaltResultSet.close(); // <-- Закрываем курсор сразу
        
        // --- 3. Сверка пароля: bcrypt на сервере + SHA-256 в БД ---
        
        const storedDoubleHash = hashSalt.PASSWORDHASH;
        const storedSalt = hashSalt.SALT; 

        // 3a. Генерируем новый bcrypt-хеш (Первый слой)
        const newBcryptHash = await bcrypt.hash(password, storedSalt); 

        // 3b. Получаем ВТОРОЙ хэш от НОВОГО первого хэша с помощью БД (Второй слой)
        const secondHashCheckResult = await connection.execute(
            `BEGIN :hashed_value := FITNESS_API_PKG.HASH_BCRYPT_HASH(:bcrypt_hash); END;`,
            { 
                bcrypt_hash: newBcryptHash, 
                hashed_value: { type: db.oracledb.STRING, dir: db.oracledb.BIND_OUT }
            }
        );
        const checkDoubleHash = secondHashCheckResult.outBinds.hashed_value;

        // 3c. Сравнение ДВОЙНЫХ хэшей
        const isMatch = (checkDoubleHash === storedDoubleHash);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Неверный логин или пароль.' });
        }
        
        // --- 4. Успешный вход ---

        const tokenPayload = { 
            userId: user.ID, 
            username: user.USERNAME, 
            role: user.ROLE 
        };
        
        const token = jwt.sign(
            tokenPayload, 
            JWT_SECRET, 
            { expiresIn: '1h' }
        );

        res.status(200).json({
            success: true,
            message: 'Вход выполнен успешно.',
            token: token,
            user: {
                id: user.ID,
                username: user.USERNAME,
                name: user.NAME,
                surname: user.SURNAME,
                role: user.ROLE
            }
        });

    } catch (err) {
        console.error('Ошибка при входе пользователя:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера при аутентификации', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});


// Роут 4: Получение данных текущего пользователя (GET) - ЗАЩИЩЕННЫЙ
// GET /api/profile

router.get('/profile', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await db.getConnection();

        const username = req.user.username; 
        await connection.execute(
            `BEGIN DBMS_SESSION.SET_IDENTIFIER(:username); END;`,
            { username: username }
        );

        const result = await connection.execute(
            `BEGIN :rc := FITNESS_API_PKG.GET_USER_PROFILE(:userId); END;`,
            {
                rc: { dir: db.oracledb.BIND_OUT, type: db.oracledb.CURSOR },
                userId: req.user.userId
            }
        );

        // Получаем первый ряд из курсора
        const resultSet = result.outBinds.rc;
        const rows = await resultSet.getRows(1); // берём 1 ряд
        await resultSet.close();

        if (!rows || rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Профиль не найден.' });
        }

        const row = rows[0];
        const profile = {
        id: row.ID,
        username: row.USERNAME,
        name: row.NAME,
        surname: row.SURNAME,
        secondname: row.SECONDNAME,
        email: row.EMAIL,
        phonenumber: row.PHONENUMBER,
        role: row.ROLE,
        createdAt: row.CREATED_AT
        };

        

        res.status(200).json({
            success: true,
            message: 'Данные профиля успешно получены.',
            profile
        });

    } catch (err) {
        console.error('Ошибка при получении профиля:', err);
        res.status(500).json({ success: false, message: 'Ошибка сервера при получении профиля', error: err.message });
    } finally {
        if (connection) {
            try {
                await connection.execute(`BEGIN DBMS_SESSION.CLEAR_IDENTIFIER; END;`);
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
});


module.exports = router;