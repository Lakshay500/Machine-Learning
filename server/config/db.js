const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not set. Copy .env.example to .env and configure it.');
    }
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    // In test mode, let the caller handle the failure instead of killing the process.
    if (process.env.NODE_ENV === 'test') {
      throw error;
    }
    process.exit(1);
  }
};

module.exports = connectDB;
