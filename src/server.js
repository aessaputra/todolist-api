// setup Express, koneksi MongoDB, dan mount routes
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Import routes (akan kita isi di langkah berikutnya)
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');

const app = express();

// ====== Middlewares global ======
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// ====== Routes utama ======
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);

// ====== 404 Handler ======
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route tidak ditemukan' });
});

// ====== Error Handler terpusat ======
app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  const status = err.statusCode || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
});

// ====== Koneksi DB & Start Server ======
const PORT = process.env.PORT
const MONGO_URI = process.env.MONGO_URI

mongoose.connect(MONGO_URI, { autoIndex: true })
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Tangkap unhandled promise rejections agar tidak silently fail
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});