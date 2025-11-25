// src/pages/LoginForm.tsx
import React, { useState } from 'react';
import { loginUser } from '../api/authAPI';
import { MessageBox } from '../components/MessageBox';
import { ProgressIndicator } from '../components/ProgressIndicator';
import type { AuthResponse } from '../types';

interface LoginFormProps {
  onSwitch: () => void;
  onLoginSuccess: (role: 'client' | 'admin') => void;
}

type Msg = { type: 'success' | 'error' | 'info'; text: string } | null;

export default function LoginForm({ onSwitch, onLoginSuccess }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Msg>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: 'info', text: 'Попытка входа...' });
    setLoading(true);

    try {
      const result: AuthResponse = await loginUser(username, password);

      if (result.success) {
        if (!result.user || !result.user.role) {
          setMessage({ type: 'error', text: 'Не удалось получить данные пользователя.' });
          return;
        }

        localStorage.setItem('token', result.token || "");


        const serverRole = String(result.user.role).toLowerCase();
        const mappedRole: 'client' | 'admin' = serverRole === 'admin' ? 'admin' : 'client';

        setMessage({ type: 'success', text: 'Успешно. Выполняется переход...' });
        

        setTimeout(() => {
          onLoginSuccess(mappedRole);
        }, 400);
      } else {
        setMessage({ type: 'error', text: result.message || 'Ошибка входа. Проверьте данные.' });
      }
    } catch (err) {
      console.error('Login error:', err);
      setMessage({ type: 'error', text: 'Ошибка сети. Убедитесь, что сервер доступен.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="form-container">
      <div className="form-content">
        <h2 className="form-title">Welcome Back</h2>
        <p className="form-subtitle">Please sign in to your account.</p>

        <form onSubmit={handleSubmit} className="form-group">
          <input
            type="text"
            name="username"
            className="input-field"
            placeholder="Логин"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            name="password"
            className="input-field"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="btn btn-success" type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Войти'}
          </button>
        </form>

<div className="form-feedback-wrapper">
  {loading && (
    <div className="form-feedback">
      <ProgressIndicator label="Выполняется вход..." />
    </div>
  )}

  {message && (
    <div className="form-feedback">
      <MessageBox type={message.type} message={message.text} />
    </div>
  )}
</div>
        <p className="switch-text">
          Ещё нет аккаунта?{' '}
          <button onClick={onSwitch} className="switch-link" type="button">
            Зарегистрироваться
          </button>
        </p>
      </div>
    </div>
  );
}
