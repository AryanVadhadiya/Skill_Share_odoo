const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const swapRoutes = require('./routes/swaps');
const adminRoutes = require('./routes/admin');
const config = require('./config');
require('dotenv').config();

const app = express();

app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://skill-share-odoofrontend-j8rndxo5k-aryan-vadhadiyas-projects.vercel.app',
    'https://skill-share-odoo.vercel.app',
    'https://skill-share-odoofrontend-1t4v9wy7v-aryan-vadhadiyas-projects.vercel.app',
    // Add any other frontend domains you use
  ],
  credentials: true
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

module.exports = app; // Do NOT call app.listen()
