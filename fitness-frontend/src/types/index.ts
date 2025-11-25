// src/types/index.ts

/** Данные формы регистрации */
export interface RegisterFormData {
  username: string;
  password: string;
  name: string;
  surname: string;
  email: string;
  role: string;
  phonenumber: string;
}

/** Данные формы входа */
export interface LoginFormData {
  username: string;
  password: string;
}

/** Ответ API при успешной авторизации */
export interface AuthResponse {
  user?: {
    username: string;
    role: 'client' | 'admin';
    name: string;
    surname: string;
  };
  token?: string;
  message?: string;
  success?: boolean;
}


/** Модель пользователя */
export interface UserData {
  id: number;
  username: string;
  name: string;
  surname: string;
  secondname: string;
  email: string;
  role: string;
  phonenumber: string;
}

/** Общий тип ошибки API */
export interface ApiError {
  message: string;
  status?: number;
}

/** Базовый ответ от сервера */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}
