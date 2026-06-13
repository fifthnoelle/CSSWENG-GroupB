//User API Routes 
const express = require("express");
const router = express.Router();

const userController = require("../controllers/user.controller");
const {
    requireAdmin,
    requireAuth
} = require("../utils/auth");

//Routes only
router.get("/", userController.home);
router.get("/current-user", requireAuth, userController.getUser);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.get("/load-users", requireAdmin, userController.getAllUsers);
router.post("/register", requireAdmin, userController.register);

module.exports = router;