const express = require("express");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const cors = require('cors');
const app = express();

const IN_PROD = process.env.NODE_ENV === 'production';
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://ricenroll:fQr9pDek3iMxTD0I@cluster0.jmti9v4.mongodb.net/?appName=Cluster0';
const frontendOrigin = process.env.FRONTEND_URL || 'https://ricenroll-inventory.onrender.com';

app.set('trust proxy', 1);

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cors({
  origin: frontendOrigin,
  credentials: true
}));

//Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'secretkeyblabla1246474014i',
    resave: false,
    saveUninitialized: true,
    store: MongoStore.create({ mongoUrl: mongoUri }),   
    cookie: {
      secure: IN_PROD,
      sameSite: IN_PROD ? 'none' : 'lax'
    }
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


