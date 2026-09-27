const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./server/config/db');

// Load environment variables
dotenv.config();

// Connect to database (skipped when the caller connects explicitly, e.g. tests)
if (!process.env.SKIP_DB_CONNECT) {
  connectDB();
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// API Routes
const authRoutes = require('./server/routes/authRoutes');
const trackRoutes = require('./server/routes/trackRoutes');
const artistRoutes = require('./server/routes/artistRoutes');
const playlistRoutes = require('./server/routes/playlistRoutes');
const userRoutes = require('./server/routes/userRoutes');

// Mount routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/tracks', trackRoutes);
app.use('/api/v1/artists', artistRoutes);
app.use('/api/v1/playlists', playlistRoutes);
app.use('/api/v1/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'The Golden Age Archive API is running',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'The Golden Age Archive',
    description: 'A comprehensive music streaming platform dedicated to preserving and exploring music from the 1930s, 1940s, and 1950s.',
    version: '1.0.0',
    api: '/api/v1'
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Global error handler:', err.stack);
  
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      message: messages.join(', ')
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expired'
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Server Error'
  });
});

// Start server (skipped when required as a module, e.g. by the smoke test)
const PORT = process.env.PORT || 5000;

let server;
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║                                                  ║
║     THE GOLDEN AGE ARCHIVE                       ║
║     Server running in ${process.env.NODE_ENV || 'development'} mode                   ║
║     Port: ${PORT}                                        ║
║     API: http://localhost:${PORT}/api/v1                  ║
║                                                  ║
╚══════════════════════════════════════════════════╝
    `);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err, promise) => {
    console.error(`Error: ${err.message}`);
    server.close(() => process.exit(1));
  });
}

module.exports = app;
