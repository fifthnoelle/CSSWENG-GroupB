const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI || 'mongodb+srv://ricenroll:fQr9pDek3iMxTD0I@cluster0.jmti9v4.mongodb.net/?appName=Cluster0';

/*
const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};*/

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB Connection Error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;