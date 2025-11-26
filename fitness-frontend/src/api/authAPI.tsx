// src/api/authAPI.tsx
import type { RegisterFormData,  AuthResponse } from '../types';

const API_BASE_URL = 'http://localhost:5000/api';

export async function loginUser(username: string, password: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const data = await response.json();
  return data as AuthResponse;
}

export async function registerUser(data: Partial<RegisterFormData>): Promise<AuthResponse> {
    
  const response = await fetch(`${API_BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Ошибка регистрации');
  }

  return result;
}

// src/api/authAPI.ts
export async function profileUser(token: string) {
  if (!token) throw new Error('Токен отсутствует');

  const response = await fetch(`${API_BASE_URL}/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Ошибка при получении профиля');
  }

  return data.profile; 
}

