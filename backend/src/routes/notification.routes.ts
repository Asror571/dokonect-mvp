import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { getNotifications, getUnreadCount, markRead, markAllRead } from '../controllers/notification.controller';

const router = express.Router();

router.get('/',              protect, getNotifications);
router.get('/unread-count',  protect, getUnreadCount);
router.patch('/read-all',    protect, markAllRead);
router.patch('/:id/read',    protect, markRead);

export default router;
