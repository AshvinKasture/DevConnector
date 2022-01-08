const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURI');

const connectDB = async () => {
  try {
    // Connect to MongoDb
    await mongoose.connect(db);
    console.log('MongoDB connected');
  } catch (err) {
    // If error occours
    console.error('Error in connecting MongoDB');
    console.error(err.message);
    process.exit(1);
  }
};

module.exports = connectDB;
