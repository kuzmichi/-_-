// src/components/admin/AdminSchedule.tsx

import React, { useMemo, useState, useEffect, useCallback } from "react";
import "../styles/AdminSchedule.css";
import { 
    fetchAdminSchedule, 
    deleteScheduleItem, 
    createScheduleItem, // <-- Добавлено
    updateScheduleItem, // <-- Добавлено
    fetchTrainers,      // <-- Добавлено
    fetchRooms,         // <-- Добавлено
    fetchActivities,    // <-- Добавлено
} from "../api/adminAPI"; 
import type { 
    ScheduleFormValues, 
    TrainerRef,         // <-- Добавлено
    RoomRef,            // <-- Добавлено
    ActivityRef         // <-- Добавлено
} from "../api/adminAPI";


// Расширенный интерфейс для AdminScheduleItem (без изменений)
export interface AdminScheduleItem {
    id: number;
    title: string;
    direction: string;
    weekday: "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";
    time: string; 
    instructor: string;
    room: string;
    capacity: number;
    booked: number;
    image?: string;
    
    // Дополнительные поля для редактирования: ID, которые не приходят в GET_SCHEDULE_FOR_ADMIN
    // Для полной формы нужно будет запросить GET_SCHEDULE_ITEM_BY_ID,
    // но пока используем заглушки для формы
    trainerId?: number; 
    roomId?: number;
    activityId?: number;
    scheduleDate?: string; 
    startTime?: string; 
    endTime?: string; 
    status: string; // Сделаем обязательным
    notes?: string;
}

const weekdays: { key: AdminScheduleItem["weekday"] | "all"; label: string }[] = [
    { key: "all", label: "Вся неделя" },
    { key: "mon", label: "Понедельник" },
    { key: "tue", label: "Вторник" },
    { key: "wed", label: "Среда" },
    { key: "thu", label: "Четверг" },
    { key: "fri", label: "Пятница" },
    { key: "sat", label: "Суббота" },
    { key: "sun", label: "Воскресенье" },
];

// *** ФУНКЦИОНАЛЬНЫЙ МОДАЛЬНЫЙ КОМПОНЕНТ ***
interface ScheduleModalProps {
    item: AdminScheduleItem | null;
    onClose: () => void;
    onSave: (values: ScheduleFormValues) => Promise<void>;
    trainers: TrainerRef[];
    rooms: RoomRef[];
    activities: ActivityRef[];
}

const ScheduleModal: React.FC<ScheduleModalProps> = ({ item, onClose, onSave, trainers, rooms, activities }) => {
    const isEditing = !!item;

    // Инициализация состояния формы
    const [formValues, setFormValues] = useState<ScheduleFormValues>({
        id: item?.id,
        // Используем заглушки или первый элемент из справочника
        trainerId: item?.trainerId || (trainers[0]?.id || 1), // 1 - заглушка
        roomId: item?.roomId || (rooms[0]?.id || 1),
        activityId: item?.activityId || (activities[0]?.id || 1),
        scheduleDate: item?.scheduleDate || new Date().toISOString().split('T')[0],
        startTime: item?.time || "10:00", 
        endTime: item?.time ? '1' : "11:00", // Заглушка, если нет end_time
        maxParticipants: item?.capacity || 20, 
        status: item?.status || 'Scheduled',
        notes: item?.notes || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormValues(prev => ({ 
            ...prev, 
            [name]: (name === 'trainerId' || name === 'roomId' || name === 'activityId' || name === 'maxParticipants') ? Number(value) : value 
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        // Дополнительная проверка на заполненность
        if (!formValues.trainerId || !formValues.roomId || !formValues.activityId || !formValues.scheduleDate || !formValues.startTime || !formValues.endTime || !formValues.maxParticipants) {
            alert('Пожалуйста, заполните все обязательные поля.');
            return;
        }
        await onSave(formValues);
    };

    // Проверка, что справочники загружены
    if (trainers.length === 0 || rooms.length === 0 || activities.length === 0) {
        return (
            <div className="modal-backdrop">
                <div className="modal-content">
                    <p>Загрузка справочных данных...</p>
                    <button onClick={onClose}>Отмена</button>
                </div>
            </div>
        )
    }


    return (
        <div className="modal-backdrop">
            <form className="modal-content" onSubmit={handleSubmit}>
                <h2>{isEditing ? `Редактировать занятие ${item?.title}` : "Добавить занятие"}</h2>
                
                <div className="form-group">
                    <label>Тренер:</label>
                    <select name="trainerId" value={formValues.trainerId} onChange={handleChange} required>
                        {trainers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                </div>

                <div className="form-group">
                    <label>Комната:</label>
                    <select name="roomId" value={formValues.roomId} onChange={handleChange} required>
                        {rooms.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>
                
                <div className="form-group">
                    <label>Активность:</label>
                    <select name="activityId" value={formValues.activityId} onChange={handleChange} required>
                        {activities.map(a => <option key={a.id} value={a.id}>{a.title} ({a.direction})</option>)}
                    </select>
                </div>

                <div className="form-row">
                    <div className="form-group half">
                        <label>Дата:</label>
                        <input type="date" name="scheduleDate" value={formValues.scheduleDate} onChange={handleChange} required />
                    </div>
                    <div className="form-group half">
                        <label>Макс. участников:</label>
                        <input type="number" name="maxParticipants" value={formValues.maxParticipants} onChange={handleChange} min="1" required />
                    </div>
                </div>
                
                <div className="form-row">
                    <div className="form-group half">
                        <label>Начало:</label>
                        <input type="time" name="startTime" value={formValues.startTime} onChange={handleChange} required />
                    </div>
                    <div className="form-group half">
                        <label>Конец:</label>
                        <input type="time" name="endTime" value={formValues.endTime} onChange={handleChange} required />
                    </div>
                </div>

                {isEditing && (
                    <div className="form-group">
                        <label>Статус:</label>
                        <select name="status" value={formValues.status} onChange={handleChange} required>
                            <option value="Scheduled">Запланировано</option>
                            <option value="Cancelled">Отменено</option>
                            <option value="Completed">Проведено</option>
                        </select>
                    </div>
                )}
                
                <div className="form-group">
                    <label>Заметки:</label>
                    <input type="text" name="notes" value={formValues.notes || ''} onChange={handleChange} />
                </div>


                <div className="modal-actions">
                    <button type="submit">
                        Сохранить
                    </button>
                    <button type="button" onClick={onClose}>Отмена</button>
                </div>
            </form>
        </div>
    );
};
// *************************************


export const AdminSchedule: React.FC = () => { 
    // 1. Состояние для данных и UI
    const [items, setItems] = useState<AdminScheduleItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [day, setDay] = useState<AdminScheduleItem["weekday"] | "all">("all");
    
    // Состояния для справочников
    const [trainers, setTrainers] = useState<TrainerRef[]>([]);
    const [rooms, setRooms] = useState<RoomRef[]>([]);
    const [activities, setActivities] = useState<ActivityRef[]>([]);

    // Состояние для модального окна
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<AdminScheduleItem | null>(null);

    // 2. Логика загрузки данных (добавлена загрузка справочников)
    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [scheduleData, trainersData, roomsData, activitiesData] = await Promise.all([
                fetchAdminSchedule(),
                fetchTrainers(), // <-- Загрузка справочников
                fetchRooms(),
                fetchActivities(),
            ]);
            setItems(scheduleData);
            setTrainers(trainersData);
            setRooms(roomsData);
            setActivities(activitiesData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Не удалось загрузить данные.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // 3. Логика CRUD операций
    
    // Открытие модального окна для создания
    const handleCreate = () => {
        setEditingItem(null); 
        setIsModalOpen(true);
    };

    // Открытие модального окна для редактирования
    const handleEdit = (item: AdminScheduleItem) => {
        setEditingItem(item); 
        setIsModalOpen(true);
    };

    // Удаление занятия
    const handleDelete = async (id: number) => {
        if (!window.confirm(`Вы уверены, что хотите удалить занятие ${id}?`)) return;
        try {
            await deleteScheduleItem(id);
            alert("Занятие успешно удалено!");
            await fetchAllData(); // Перезагружаем расписание после удаления
        } catch (err) {
            alert(`Ошибка при удалении: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
        }
    };
    
    // Сохранение (добавление/редактирование) из модального окна
    const handleSave = async (values: ScheduleFormValues) => {
        try {
            if (values.id) {
                // Редактирование
                await updateScheduleItem(values); // <-- Раскомментировано
            } else {
                // Добавление
                await createScheduleItem(values); // <-- Раскомментировано
            }
            setIsModalOpen(false);
            alert("Занятие успешно сохранено!");
            await fetchAllData(); // Перезагружаем расписание после сохранения
        } catch (err) {
            alert(`Ошибка при сохранении: ${err instanceof Error ? err.message : "Неизвестная ошибка"}`);
        }
    };

    // Фильтрация данных (логика не меняется)
    const filtered = useMemo(() => {
        if (day === "all") return items;
        return items.filter((i) => i.weekday === day);
    }, [day, items]);

    if (loading) return <div className="admin-schedule">Загрузка расписания...</div>;
    if (error) return <div className="admin-schedule error">Ошибка: {error}</div>;


    return (
<div className="admin-schedule">
    {/* Кнопка Добавить занятие */}
    <button className="btn-add-new" onClick={handleCreate}>+ Добавить занятие</button>

    {/* Tabs */}
    <div className="schedule-tabs">
        {weekdays.map((w) => (
            <button
                key={w.key}
                className={`schedule-tab ${day === w.key ? "active" : ""}`}
                onClick={() => setDay(w.key)}
            >
                {w.label}
            </button>
        ))}

        <div className="schedule-count">Найдено: {filtered.length}</div>
    </div>

    {/* Cards */}
    <div className="schedule-grid">
        {filtered.map((item) => (
            <div key={item.id} className="schedule-card">
                
                <div className="card-image">
                    <div className={`tag tag-${item.direction.toLowerCase().replace(" ", "")}`}>
                        {item.direction}
                    </div>

                    {item.image ? (
                        <img src={item.image} alt={item.title} />
                    ) : (
                        <div className="placeholder" />
                    )}
                </div>

                <h3 className="card-title">{item.title}</h3>

                <div className="card-time">
                    {item.time} <span className="day">{item.weekday.toUpperCase()}</span>
                </div>

                <div className="card-trainer">{item.instructor}</div>
                <div className="card-room">{item.room}</div>

                <div className="spots-row">
                    <span>Свободно: {item.capacity - item.booked} мест</span>
                    <span>
                        {item.booked}/{item.capacity}
                    </span>
                </div>

                <div className="progress">
                    <div
                        className="progress-fill"
                        style={{ width: `${(item.booked / item.capacity) * 100}%` }}
                    ></div>
                </div>

                {/* Actions: Добавлена логика onClick */}
                <div className="card-actions">
                    <button className="btn-edit" onClick={() => handleEdit(item)}>Редактировать</button>
                    <button className="btn-delete" onClick={() => handleDelete(item.id)}>Удалить</button>
                </div>
            </div>
        ))}
    </div>

    {/* Модальное окно */}
    {isModalOpen && (
        <ScheduleModal
            item={editingItem}
            onClose={() => setIsModalOpen(false)}
            onSave={handleSave}
            trainers={trainers}
            rooms={rooms}
            activities={activities}
        />
    )}
</div>

    );
};
