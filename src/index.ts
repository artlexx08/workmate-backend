import express from 'express';
import User from './models/User';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes';
import workerRoutes from './routes/workerRoutes';
import attendanceRoutes from './routes/attendanceRoutes';
import salaryRoutes from './routes/salaryRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

/* ---------------- ROOT TEST ---------------- */
app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json());

/* ---------------- CORS FIX (IMPORTANT) ---------------- */
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://workmate-frontend.vercel.app" // 🔥 change this to your real Vercel URL
    ],
    credentials: true,
  })
);

/* Allow headers for auth */
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Headers", "Content-Type, x-auth-token");
  next();
});

/* ---------------- ROUTES ---------------- */
app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/salary', salaryRoutes);

/* ---------------- DB + SERVER ---------------- */
const startServer = async () => {
  console.log('🚀 Starting WorkMate backend...');

  let mongoUri = process.env.MONGODB_URI;

  if (!mongoUri || mongoUri.trim() === '') {
    const mongoServer = await MongoMemoryServer.create();
    mongoUri = mongoServer.getUri();
    console.log('🗄️ Using in-memory MongoDB');
  }

  const connectWithRetry = async (attempt = 1) => {
    try {
      await mongoose.connect(mongoUri);
      console.log('✅ Connected to MongoDB');

      app.listen(Number(PORT), '0.0.0.0', () => {
        console.log(`🌐 Server running on port ${PORT}`);

        /* ---------------- SEED DEFAULT USER ---------------- */
        (async () => {
          const existing = await User.findOne({ email: 'manager@workmate.com' });

          if (!existing) {
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash('Password123!', salt);

            await new User({
              name: 'Default Manager',
              email: 'manager@workmate.com',
              password: hashed,
              role: 'manager',
            }).save();

            console.log('🛠️ Default manager created');
          }
        })();
      });

    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${attempt} failed:`, err);

      if (attempt < 3) {
        setTimeout(() => connectWithRetry(attempt + 1), 2000);
      } else {
        console.error('💥 DB connection failed after retries');
        process.exit(1);
      }
    }
  };

  await connectWithRetry();
};

startServer();