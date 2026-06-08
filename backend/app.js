const express = require("express");
const session = require('express-session');
const MongoStore = require('connect-mongo');
const app = express();

const isProd = process.env.NODE_ENV === 'production';
const sessionSecret = process.env.SESSION_SECRET || 'b3d9f8c54f1b2e73e7a8c1a5d9e7f4c2a1b0d3e6f7c8a9b0d4e5f6a7b1c2d3e';
const mongoUri = process.env.MONGO_URI || 'mongodb+srv://ricenroll:fQr9pDek3iMxTD0I@cluster0.jmti9v4.mongodb.net/?appName=Cluster0';

//Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

if (isProd) {
    app.set('trust proxy', 1);
}

//Session configuration
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: mongoUri,
        collectionName: 'sessions',
        ttl: 14 * 24 * 60 * 60 // 14 days
    }),
    cookie: {
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        httpOnly: true,
        maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
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


