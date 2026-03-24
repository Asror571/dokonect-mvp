import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes    from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes   from './routes/order.routes';
import profileRoutes from './routes/profile.routes';
import { notFound, errorHandler } from './middleware/error.middleware';

dotenv.config();

// Connect to MongoDB
connectDB();

const app: Express = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth',    authRoutes);
app.use('/api',         productRoutes);
app.use('/api',         orderRoutes);
app.use('/api/profile', profileRoutes);

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'Dokonect API is running', db: 'MongoDB' });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

export default app;
