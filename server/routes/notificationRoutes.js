import express from 'express';
import { verifyAuth } from '../middleware/authMiddleware.js';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from '../controllers/notificationController.js';

const router = express.Router();

router.get('/',             verifyAuth, getNotifications);
router.put('/read-all',     verifyAuth, markAllAsRead);
router.put('/:id/read',     verifyAuth, markAsRead);
router.delete('/:id',       verifyAuth, deleteNotification);

export default router;
