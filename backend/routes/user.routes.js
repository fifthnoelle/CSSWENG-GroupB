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
router.get("/search-users", requireAdmin, userController.searchUsers);
router.post("/register", requireAdmin, userController.register);
router.patch("/update-user/:id", requireAdmin, userController.updateUser);
// Self-service password change (any authenticated role), re-authenticates with current password
router.post("/change-password", requireAuth, userController.changePassword);
// Public — forgot password via security question (2.1.8). No auth required by design.
router.post("/forgot-password/question", userController.getSecurityQuestion);
router.post("/forgot-password/reset", userController.resetPasswordWithAnswer);
// NEW: Delete user route, protected by requireAdmin
// The ":id" allows us to pass the specific user's database ID in the URL
router.delete("/delete-user/:id", requireAdmin, userController.deleteUser);

module.exports = router;
