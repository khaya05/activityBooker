import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { StatusCodes } from 'http-status-codes';

import authRouter from './routes/authRouter.js';
import userRouter from './routes/userRouter.js';
import childRouter from './routes/childRouter.js';
import classRouter from './routes/classRouter.js';
import bookingRouter from './routes/bookingRouter.js';
import purchaseRouter from './routes/purchaseRouter.js';
import { authenticateUser } from './middleware/authMiddleware.js';
import { getPacks } from './controllers/purchaseController.js';

const app = express();

// ─── CORS — must be before all routes ─────────────────────
// credentials:true is required for cookies to be sent cross-origin
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://127.0.0.1:5500',
  credentials: true,
}));

// ─── Global middleware ────────────────────────────────────
app.use(express.json());
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Routes ───────────────────────────────────────────────
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', authenticateUser, userRouter);
app.use('/api/v1/children', authenticateUser, childRouter);
app.use('/api/v1/classes', classRouter);
app.use('/api/v1/bookings', authenticateUser, bookingRouter);
app.use('/api/v1/purchases', authenticateUser, purchaseRouter);

// Public — pack definitions
app.get('/api/v1/packs', getPacks);

// ─── 404 handler ─────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({ msg: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────
app.use((err, req, res, next) => {
  const status = err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err.message || 'Something went wrong';
  res.status(status).json({ msg: message });
});

// ─── Start ────────────────────────────────────────────────
const port = process.env.PORT || 5100;

try {
  await mongoose.connect(process.env.MONGO_URL);
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
} catch (error) {
  console.log(error);
  process.exit(1);
}