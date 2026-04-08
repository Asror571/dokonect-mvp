import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getNotifications, getUnreadCount, markRead, markAllRead } from '../controllers/notification.controller';

const router = express.Router();

router.get('/',              authenticate, getNotifications);
router.get('/unread-count',  authenticate, getUnreadCount);
router.patch('/read-all',    authenticate, markAllRead);
router.patch('/:id/read',    authenticate, markRead);

export default router;
