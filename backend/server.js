const app = require("./app");
const connectDB = require("./db");

// Connect to MongoDB (default local URI used in db.js)
connectDB();

// Default port for development. Change directly in this file if needed.
//const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
