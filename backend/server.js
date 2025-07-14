const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();
// Load environment variables
const app = express();

const allowedOrigins = process.env.REACT_APP_ALLOWED_ORIGINS
  ? process.env.REACT_APP_ALLOWED_ORIGINS.split(',')
  : [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3001',
      'http://localhost:3004',
      'https://skill-swap-frontend.vercel.app',
      'https://skill-swap-frontend-git-main.vercel.app'
    ];

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like Postman or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/swaps', require('./routes/swaps'));
app.use('/api/admin', require('./routes/admin'));

// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Skill Swap Platform API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT =  8088;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

