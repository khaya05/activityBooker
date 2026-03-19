import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import morgan from 'morgan';

const app = express()

app.use(express.json());

// routes
app.use('/api/v1/auth', () =>{})
app.use('/api/v1/parents', () =>{})
app.use('/api/v1/children', () =>{})
app.use('/api/v1/lessons', () =>{})


app.use('*', (req, res) =>{
  res.status(statusCodes)
})

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'))
}

const port = process.env.PORT || 5100

try {
  await mongoose.connect(process.env.MONGO_URL);
  app.listen(port, () => {
    console.log(`App running on port ${port}`);
  })
} catch (error) {
  console.log(error)
  process.exit(1)
}



