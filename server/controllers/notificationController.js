import * as Notification from '../models/Notification.js';
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import docClient from "../config/db.js";

// GET /api/notifications
export async function getNotifications(req, res) {
    try {
        const notifications = await Notification.getByUser(req.user.email);
        const unreadCount = notifications.filter(n => !n.isRead).length;
        return res.status(200).json({ success: true, data: notifications, unreadCount });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// PUT /api/notifications/read-all
export async function markAllAsRead(req, res) {
    try {
        await Notification.markAllAsRead(req.user.email);
        return res.status(200).json({ success: true, message: 'All notifications marked as read.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// PUT /api/notifications/:id/read
export async function markAsRead(req, res) {
    try {
        await Notification.markAsRead(req.params.id);
        return res.status(200).json({ success: true, message: 'Notification marked as read.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// DELETE /api/notifications/:id
export async function deleteNotification(req, res) {
    try {
        await Notification.deleteOne(req.params.id);
        return res.status(200).json({ success: true, message: 'Notification deleted.' });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
}

// Internal helper: broadcast PASSPORT_ADDED to all users except the one who added
export async function broadcastPassportAdded(senderEmail, senderName, count) {
    try {
        const result = await docClient.send(new ScanCommand({ TableName: 'Users' }));
        const allUsers = result.Items || [];
        const others = allUsers.filter(u => u.email !== senderEmail);

        const message = `${senderName} added ${count} passenger record${count > 1 ? 's' : ''}.`;

        await Promise.all(
            others.map(u =>
                Notification.create({
                    recipientEmail: u.email,
                    senderEmail,
                    senderName,
                    type: 'PASSPORT_ADDED',
                    message,
                    quantity: count,
                })
            )
        );
    } catch (error) {
        console.error('Failed to broadcast PASSPORT_ADDED notification:', error.message);
    }
}
