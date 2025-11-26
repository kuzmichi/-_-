// src/api/adminAPI.tsx

import type { AdminScheduleItem } from '../components/AdminSchedule';

const API_BASE_URL = 'http://localhost:5000/api';
const ADMIN_API_URL = `${API_BASE_URL}/admin/schedule`;
const ADMIN_REF_URL = `${API_BASE_URL}/admin/ref`;

// ============================================
// 1. ИНТЕРФЕЙСЫ ДЛЯ ДАННЫХ
// ============================================

export interface TrainerRef {
    id: number;
    name: string;
}

export interface RoomRef {
    id: number;
    name: string;
}

export interface ActivityRef {
    id: number;
    title: string;
    direction: string;
}

// Интерфейс для данных, отправляемых на создание/редактирование занятия
export interface ScheduleFormValues {
  id?: number; 
  trainerId: number;
  roomId: number;
  activityId: number;
  scheduleDate: string; // Дата в формате YYYY-MM-DD
  startTime: string; // Время в формате HH:MM
  endTime: string; // Время в формате HH:MM
  maxParticipants: number;
  status?: string; 
  notes?: string;
}

// Интерфейс для одного элемента расписания, возвращаемого из Oracle/Node.js
// Поля названы так, как их вернул GET_SCHEDULE_FOR_ADMIN (UPPERCASE)
interface ScheduleDbItem {
    ID: number;
    TITLE: string;
    DIRECTION: string;
    WEEKDAY_SHORT: string;
    START_TIME_STR: string;
    INSTRUCTOR: string;
    ROOM: string;
    CAPACITY: number;
    BOOKED: number;
    SCHEDULE_DATE: string; 
    STATUS: string;
    // ... и другие поля, если есть, например IMAGE
}

// Универсальный тип для ответа сервера с явным типом данных T
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  id?: number;
  error?: string;
}

// ============================================
// 2. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

const getToken = (): string => {
    const token = localStorage.getItem('token'); 
    if (!token) {
        throw new Error('Токен аутентификации отсутствует. Необходим вход Администратора.');
    }
    return token;
}

// Маппинг дней недели (пример)
const weekdayMap: { [key: string]: AdminScheduleItem["weekday"] } = {
  "пн": "mon", "вт": "tue", "ср": "wed", "чт": "thu", "пт": "fri", "сб": "sat", "вс": "sun",
  "mon": "mon", "tue": "tue", "wed": "wed", "thu": "thu", "fri": "fri", "sat": "sat", "sun": "sun",
};

// ============================================
// 3. API ФУНКЦИИ
// ============================================

/**
 * Получает полное расписание для отображения в админ-панели.
 */
export async function fetchAdminSchedule(): Promise<AdminScheduleItem[]> {
  const token = getToken();

  const response = await fetch(ADMIN_API_URL, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  // Указываем явный тип для результата ответа с данными
  const result: ApiResponse<ScheduleDbItem[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Ошибка при загрузке расписания.');
  }

  // Проверяем, что data является массивом перед использованием .map
  if (!Array.isArray(result.data)) {
      throw new Error('Получен некорректный формат данных расписания.');
  }

  // Явное приведение типа для map
  return result.data.map((dbItem: ScheduleDbItem) => ({
    id: dbItem.ID,
    title: dbItem.TITLE,
    direction: dbItem.DIRECTION,
    // Нормализация дня недели: приведение к нижнему регистру и использование маппинга
    weekday: (weekdayMap[dbItem.WEEKDAY_SHORT.toLowerCase()] || "mon") as AdminScheduleItem['weekday'],
    time: dbItem.START_TIME_STR,
    instructor: dbItem.INSTRUCTOR,
    room: dbItem.ROOM,
    capacity: dbItem.CAPACITY,
    booked: dbItem.BOOKED,
    scheduleDate: dbItem.SCHEDULE_DATE, 
    status: dbItem.STATUS,
    image: undefined, 
  }));
}


/**
 * Отправляет данные для создания нового занятия.
 */
export async function createScheduleItem(data: ScheduleFormValues): Promise<number> {
  const token = getToken();

  const response = await fetch(`${ADMIN_API_URL}/create`, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<null> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Ошибка при добавлении занятия.');
  }

  return result.id!; 
}


/**
 * Отправляет данные для редактирования существующего занятия.
 */
export async function updateScheduleItem(data: ScheduleFormValues): Promise<void> {
  if (!data.id) throw new Error('ID занятия обязателен для обновления.');
  const token = getToken();

  const response = await fetch(`${ADMIN_API_URL}/update`, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<null> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || `Ошибка при обновлении занятия ${data.id}.`);
  }
}


/**
 * Удаляет занятие по его ID.
 */
export async function deleteScheduleItem(scheduleId: number): Promise<void> {
  const token = getToken();

  const response = await fetch(`${ADMIN_API_URL}/delete`, {
    method: 'POST',
    headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ scheduleId }),
  });

  const result: ApiResponse<null> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.message || `Ошибка при удалении занятия ${scheduleId}.`);
  }
}


export async function fetchTrainers(): Promise<TrainerRef[]> {
    const token = getToken();

    const response = await fetch(`${ADMIN_REF_URL}/trainers`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
    });

    const result: ApiResponse<TrainerRef[]> = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || "Ошибка при загрузке тренеров");
    }

    return result.data || [];
}




export async function fetchRooms(): Promise<RoomRef[]> {
    const token = getToken();

    const response = await fetch(`${ADMIN_REF_URL}/rooms`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    const result: ApiResponse<RoomRef[]> = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Ошибка при загрузке комнат.');
    }

    return result.data || [];
}


export async function fetchActivities(): Promise<ActivityRef[]> {
    const token = getToken();

    const response = await fetch(`${ADMIN_REF_URL}/activities`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
    });

    const result: ApiResponse<ActivityRef[]> = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(result.message || 'Ошибка при загрузке активностей.');
    }

    return result.data || [];
}
