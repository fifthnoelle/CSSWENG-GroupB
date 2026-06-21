console.log('🔥 Backend function starting...');
try {
  require('dotenv').config({ path: __dirname + '/.env' });
} catch (e) {
  // dotenv not installed, skip .env loading
}

const app = require("./app");
const connectDB = require("./db");

connectDB().catch((err) => console.error('DB connection error:', err));

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
