import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const NotificationContext = createContext(null);

const API = 'http://localhost:3000/api';
const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('authToken')}` });

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const refresh = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        try {
            const { data } = await axios.get(`${API}/notifications`, { headers: authHeaders() });
            if (data.success) {
                setNotifications(data.data);
                setUnreadCount(data.unreadCount);
            }
        } catch {
            // silently fail — don't disrupt user experience
        }
    }, []);

    // Fetch on mount and poll every 30 seconds
    useEffect(() => {
        refresh();
        const interval = setInterval(refresh, 30000);
        return () => clearInterval(interval);
    }, [refresh]);

    const markAsRead = async (id) => {
        try {
            await axios.put(`${API}/notifications/${id}/read`, {}, { headers: authHeaders() });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {}
    };

    const markAllAsRead = async () => {
        try {
            await axios.put(`${API}/notifications/read-all`, {}, { headers: authHeaders() });
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch {}
    };

    const deleteNotification = async (id) => {
        const wasUnread = notifications.find(n => n.id === id)?.isRead === false;
        try {
            await axios.delete(`${API}/notifications/${id}`, { headers: authHeaders() });
            setNotifications(prev => prev.filter(n => n.id !== id));
            if (wasUnread) setUnreadCount(prev => Math.max(0, prev - 1));
        } catch {}
    };

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, refresh }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
