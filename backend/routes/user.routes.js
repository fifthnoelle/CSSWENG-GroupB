//User API Routes 
const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const {
    requireAdmin,
    requireAuth
} = require("../utils/auth");

//Routes only
router.get("/", userController.getHome);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
//TODO: Add authentication middleware to requireAdmin when login is complete
router.get("/user", requireAuth, userController.getUser);

router.post("/register", requireAdmin, userController.register);

module.exports = router;