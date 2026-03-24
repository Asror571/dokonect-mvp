import express from 'express';
import { protect } from '../middleware/auth.middleware';
import { getChatRooms, createChatRoom, getRoomMessages, markRoomRead } from '../controllers/chat.controller';

const router = express.Router();

router.get('/rooms',                   protect, getChatRooms);
router.post('/rooms',                  protect, createChatRoom);
router.get('/rooms/:roomId/messages',  protect, getRoomMessages);
router.patch('/rooms/:roomId/read',    protect, markRoomRead);

export default router;
