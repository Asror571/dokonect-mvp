import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import 'express-async-errors';

import authRoutes         from './routes/auth.routes';
import productRoutes      from './routes/product.routes';
import orderRoutes        from './routes/order.routes';
import profileRoutes      from './routes/profile.routes';
import analyticsRoutes    from './routes/analytics.routes';
import chatRoutes         from './routes/chat.routes';
import reviewRoutes       from './routes/review.routes';
import adminRoutes        from './routes/admin.routes';
import notificationRoutes from './routes/notification.routes';
import { notFound, errorHandler } from './middleware/error.middleware';
import { initChatSocket } from './sockets/chat.socket';

dotenv.config();

const app: Express = express();
const httpServer   = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003'
    ],
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003'
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',          authRoutes);
app.use('/api',               productRoutes);
app.use('/api',               orderRoutes);
app.use('/api/profile',       profileRoutes);
app.use('/api/analytics',     analyticsRoutes);
app.use('/api/chat',          chatRoutes);
app.use('/api/reviews',       reviewRoutes);
app.use('/api/admin',         adminRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Dokonect V2 API is running', version: '2.0.0' });
});

app.use(notFound);
app.use(errorHandler);

initChatSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
