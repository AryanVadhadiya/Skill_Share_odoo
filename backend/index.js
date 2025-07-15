const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const swapRoutes = require('./routes/swaps');
const adminRoutes = require('./routes/admin');
const config = require('./config');
require('dotenv').config();
const connectDB = require('./connectDB');
connectDB();

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://skill-share-odoo.vercel.app',
  'https://skill-share-odoo-lcrc.vercel.app', // added new production frontend
];

// Regex for Vercel preview deployments
const vercelPreviewRegex = /^https:\/\/skill-share-odoofrontend-.*-aryan-vadhadiyas-projects\.vercel\.app$/;

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      vercelPreviewRegex.test(origin)
    ) {
      return callback(null, true);
    } else {
      console.error('CORS denied for origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, process.env.UPLOADS_PATH || 'uploads')));

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/swaps', swapRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

module.exports = app; // Do NOT call app.listen()
