const express = require("express");
const session = require('express-session');
const cors = require('cors');
const MongoStore = require('connect-mongo').default;
const app = express();

app.set('trust proxy', 1);

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));

//Session configuration
//TODO: IMPLEMENT - Configure session store (e.g., MongoDB session store) for production
const sessionConfig = {
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true,
        sameSite: 'lax',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24
    }
};

app.use(session(sessionConfig));

app.use((req, res, next) => {
    console.log('SESSION ID:', req.sessionID, 'SESSION DATA:', req.session);
    next();
})

//Handlebars view engine
const handlebars = require("express-handlebars");
app.set("view engine", "hbs");
app.engine("hbs", handlebars.engine({
    extname: "hbs"
}));

//Routes
const userRoutes = require('./routes/user.routes');
app.use('/api', userRoutes);
//Inventory Route
const inventoryRoutes = require('./routes/inventory.routes');
app.use('/api/inventory', inventoryRoutes);

// 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ message: 'Not Found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

module.exports = app;


