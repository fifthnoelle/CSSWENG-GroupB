const express = require("express");
const session = require('express-session');
const cors = require('cors');
const MongoStore = require('connect-mongo').default;
const app = express();

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors({
  origin: 'https://ricenroll-inventory.onrender.com',
  credentials: true
}));

//Session configuration
//TODO: IMPLEMENT - Configure session store (e.g., MongoDB session store) for production
const sessionOptions = {
    // Simple hardcoded secret for student/dev environment.
    // Change this value directly in this file for class projects.
    secret: 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: 'none',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
}

if (process.env.MONGODB_URI) {
    sessionOptions.store = MongoStore.create({ mongoUrl: process.env.MONGODB_URI });
}

app.use(session(sessionOptions));

//Handlebars view engine
const handlebars = require("express-handlebars");
app.set("view engine", "hbs");
app.engine("hbs", handlebars.engine({
    extname: "hbs"
}));

// Routes mounted under /api to match platform rewrites
const userRoutes = require('./routes/user.routes');
app.use('/api', userRoutes);
// Inventory Route
const inventoryRoutes = require('./routes/inventory.routes');
app.use('/api/inventory', inventoryRoutes);

// 404 handler for unknown routes
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// JSON error handler — returns `{ message }` for clients
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err && err.stack ? err.stack : err);
    const status = err.status || 500;
    const message = err.message || 'Internal server error';
    res.status(status).json({ message });
});
module.exports = app;


