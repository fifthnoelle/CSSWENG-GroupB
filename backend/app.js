const express = require("express");
const session = require('express-session');
const cors = require('cors');
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
app.use(session({
    // Simple hardcoded secret for student/dev environment.
    // Change this value directly in this file for class projects.
    secret: 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } //TODO: Set to true when using HTTPS
}));

//Handlebars view engine
const handlebars = require("express-handlebars");
app.set("view engine", "hbs");
app.engine("hbs", handlebars.engine({
    extname: "hbs"
}));

//Routes
const userRoutes = require('./routes/user.routes');
app.use('/', userRoutes);
//Inventory Route
const inventoryRoutes = require('./routes/inventory.routes');
app.use('/inventory', inventoryRoutes);
module.exports = app;


