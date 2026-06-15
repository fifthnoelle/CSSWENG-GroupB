require('dotenv').config({ path: __dirname + '/.env' });
const app = require("./app");
const connectDB = require("./db");

// Connect to MongoDB (default URI can be overridden by MONGODB_URI)
connectDB();

// Use the port Render provides, otherwise fall back to 3000 for local development.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
