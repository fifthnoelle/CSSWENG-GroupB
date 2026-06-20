console.log('🔥 Backend function starting...');
try {
  require('dotenv').config({ path: __dirname + '/.env' });
} catch (e) {
  // dotenv not installed, skip .env loading
}

const app = require("./app");
const connectDB = require("./db");

// For local development: start server if this file is run directly
if (require.main === module) {
  connectDB().then(() => {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  });
}

// Export a handler that ensures DB connection before processing each request (for Vercel serverless)
module.exports = async (req, res) => {
  await connectDB();
  return app(req, res);
};
