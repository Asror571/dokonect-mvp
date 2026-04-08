import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getChatRooms,
  createChatRoom,
  getRoomMessages,
  sendMessage,
  markRoomAsRead,
  getConversations,
} from '../controllers/chat.controller';

const router = express.Router();

router.use(authenticate);

// Chat rooms
router.get('/rooms', getChatRooms);
router.post('/rooms', createChatRoom);

// Messages
router.get('/rooms/:roomId/messages', getRoomMessages);
router.post('/rooms/:roomId/messages', sendMessage);

// Mark as read
router.patch('/rooms/:roomId/read', markRoomAsRead);

// Legacy endpoints
router.get('/conversations', getConversations);

export default router;
