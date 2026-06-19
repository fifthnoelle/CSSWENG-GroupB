console.log('🔥 Backend function starting...');
try {
  require('dotenv').config({ path: __dirname + '/.env' });
} catch (e) {
  // dotenv not installed, skip .env loading
}

const app = require("./app");
const connectDB = require("./db");

// Connect to MongoDB (default URI can be overridden by MONGODB_URI)
connectDB();

// For local development: start server if this file is run directly
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// Export app for Vercel serverless
module.exports = app;
