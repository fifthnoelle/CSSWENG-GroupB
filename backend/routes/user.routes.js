//User API Routes 
const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();

const userController = require("../controllers/user.controller");
const {
    requireAdmin,
    requireAuth
} = require("../utils/auth");

// Feature: IP-based rate limiting on authentication endpoints. The
// per-account lockout in user.controller.js (5 failed attempts) is solid
// against someone hammering ONE account, but does nothing to stop a
// low-and-slow attack spread across many different accounts or unknown
// emails — a handful of attempts per account never trips any single
// account's lockout. This adds a complementary, per-source-IP limit.
const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,                  // 20 requests per IP per window, across login + forgot-password
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts from this network. Please wait a few minutes and try again." }
});

//Routes only
router.get("/", userController.home);
router.get("/current-user", requireAuth, userController.getUser);
router.post("/login", authRateLimiter, userController.login);
router.post("/logout", userController.logout);
router.get("/load-users", requireAdmin, userController.getAllUsers);
router.get("/search-users", requireAdmin, userController.searchUsers);
router.post("/register", requireAdmin, userController.register);
router.patch("/update-user/:id", requireAdmin, userController.updateUser);
// Self-service password change (any authenticated role), re-authenticates with current password
router.post("/change-password", requireAuth, userController.changePassword);
// Feature: self-service security question update (any authenticated
// role), re-authenticates with current password — see updateSecurityQuestion.
router.post("/update-security-question", requireAuth, userController.updateSecurityQuestion);
// Public — forgot password via security question (2.1.8). No auth required by design.
router.post("/forgot-password/question", authRateLimiter, userController.getSecurityQuestion);
router.post("/forgot-password/reset", authRateLimiter, userController.resetPasswordWithAnswer);
// NEW: Delete user route, protected by requireAdmin
// The ":id" allows us to pass the specific user's database ID in the URL
router.delete("/delete-user/:id", requireAdmin, userController.deleteUser);

module.exports = router;
