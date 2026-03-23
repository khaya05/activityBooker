import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { StatusCodes } from 'http-status-codes';

import authRouter from './routes/authRouter.js';
import userRouter from './routes/userRouter.js';
import childRouter from './routes/childRouter.js';
import classRouter from './routes/classRouter.js';
import { authenticateUser } from './middleware/authMiddleware.js';

const app = express();

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
// app.use('/api/v1/lessons',  authenticateUser, lessonsRouter);

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