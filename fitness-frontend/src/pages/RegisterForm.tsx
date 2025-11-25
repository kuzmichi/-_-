import React, { useState } from 'react';
import { registerUser } from '../api/authAPI';
import { MessageBox } from '../components/MessageBox';
import { ProgressIndicator } from '../components/ProgressIndicator';
import type { RegisterFormData } from '../types';

interface RegisterPageProps {
  onSwitch: () => void;
}

type Msg = { type: 'success' | 'error' | 'info'; text: string } | null;

export default function RegisterPage({ onSwitch }: RegisterPageProps) {
  const [form, setForm] = useState<Partial<RegisterFormData>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Msg>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: 'info', text: 'Выполняется регистрация...' });
    setLoading(true);

try {
    console.log(form);
  const result = await registerUser(form);
  if (result.success) {
    setMessage({ type: 'success', text: 'Регистрация успешна! Подтвердите почту, после чего вы сможете войти.' });
  } else {
    setMessage({ type: 'error', text: result.message || 'Ошибка регистрации' });
  }
} catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Неизвестная ошибка';
    setMessage({ type: 'error', text: errorMessage });
} finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-content">
        <h2 className="form-title">Регистрация</h2>
        <p className="form-subtitle">Создайте новый аккаунт</p>

        <form onSubmit={handleSubmit} className="form-group">
            <input type="text" name="username" placeholder="Логин" className="input-field" onChange={handleChange} required />
            <input type="password" name="password" placeholder="Пароль" className="input-field" onChange={handleChange} required />
            <input type="text" name="name" placeholder="Имя" className="input-field" onChange={handleChange} required />
            <input type="text" name="surname" placeholder="Фамилия" className="input-field" onChange={handleChange} required />
            <input type="text" name="secondname" placeholder="Отчество" className="input-field" onChange={handleChange} />
            <input type="email" name="email" placeholder="Email" className="input-field" onChange={handleChange} required />
            <input type="tel" name="phonenumber" placeholder="Номер телефона" className="input-field" onChange={handleChange} required />



          <button className="btn btn-success" type="submit" disabled={loading}>
            {loading ? 'Создание...' : 'Зарегистрироваться'}
          </button>
        </form>

        {/* 2. Добавлена обертка для сообщений, как в LoginForm */}
        <div className="form-feedback-wrapper">
          {loading && (
            <div className="form-feedback">
              <ProgressIndicator label="Выполняется..." />
            </div>
          )}

          {message && !loading && ( // Показываем сообщение только когда загрузка завершена
            <div className="form-feedback">
              <MessageBox type={message.type} message={message.text} />
            </div>
          )}
        </div>


        <p className="switch-text">
          Уже есть аккаунт?{' '}
          <button type="button" className="switch-link" onClick={onSwitch}>
            Войти
          </button>
        </p>
      </div>
    </div>
  );
}