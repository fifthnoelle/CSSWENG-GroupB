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

// NEW: Delete user route, protected by requireAdmin
// The ":id" allows us to pass the specific user's database ID in the URL
router.delete("/user/:id", requireAdmin, userController.deleteUser);

module.exports = router;