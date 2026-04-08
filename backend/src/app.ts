import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import path from 'path';
import 'express-async-errors';

import authRoutes         from './routes/auth.routes';
import adminRoutesV3      from './routes/admin.routes.v3';
import adminRoutesV4      from './routes/admin.routes.v4';
import distributorRoutes  from './routes/distributor.routes';
import driverRoutes       from './routes/driver.routes';
import clientRoutes       from './routes/client.routes';
import productRoutes      from './routes/product.routes';
import orderRoutes        from './routes/order.routes';
import debtRoutes         from './routes/debt.routes';
import notificationRoutes from './routes/notification.routes';
import chatRoutes         from './routes/chat.routes';
import { notFound, errorHandler } from './middleware/error.middleware';
import { initOrderSocket } from './sockets/order.socket';
import { initChatSocket }  from './sockets/chat.socket';

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
    methods: ['GET', 'POST', 'PATCH'],
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

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth',          authRoutes);
app.use('/api/admin',         adminRoutesV4);
app.use('/api/admin/v3',      adminRoutesV3);
app.use('/api/distributor',   distributorRoutes);
app.use('/api/driver',        driverRoutes);
app.use('/api/client',        clientRoutes);
app.use('/api/store',         clientRoutes);
app.use('/api/products',      productRoutes);
app.use('/api/orders',        orderRoutes);
app.use('/api/debts',         debtRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat',          chatRoutes);

// Make io accessible in controllers
app.set('io', io);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Dokonect V3 API is running', version: '3.0.0' });
});

app.use(notFound);
app.use(errorHandler);

// Initialize sockets
initOrderSocket(io);
initChatSocket(io);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
