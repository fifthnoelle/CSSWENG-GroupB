require('dotenv').config({ path: __dirname + '/.env' });
const app = require("./app");
const connectDB = require("./db");

// Connect to MongoDB (default URI can be overridden by MONGODB_URI)
connectDB();

// When running locally, start the Express server.
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;


