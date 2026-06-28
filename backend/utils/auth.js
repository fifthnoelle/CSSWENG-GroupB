const bcrypt = require("bcrypt");
const { createLog } = require("../controllers/logs.controller");

//Utility function to hash passwords
const hashPassword = (password) => {
    return bcrypt.hash(password, 10);
};

// 2.1.4 / 2.1.5 / 2.3.3 — password complexity & length policy.
// Centralized here so register() and changePassword() enforce the same rule.
const PASSWORD_MIN_LENGTH = 12;
const validatePasswordPolicy = (password) => {
    if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
        return `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`;
    }
    if (password.length > 128) {
        return "Password must be at most 128 characters long.";
    }
    if (!/[a-z]/.test(password)) return "Password must contain a lowercase letter.";
    if (!/[A-Z]/.test(password)) return "Password must contain an uppercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain a number.";
    if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain a special character.";
    return null; // null = passes policy
};

// Middleware to check if user is authenticated
// 2.4.6 — access control failures must be logged.
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        createLog({
            req,
            logType: 'accounts',
            actionType: 'access-control-failure',
            notes: `Unauthenticated request to ${req.method} ${req.originalUrl}`
        });
        return res.status(401).json({ error: "Unauthorized access. Please log in." });
    }
    next();
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    // check if user is logged in
    if (!req.session.userId) {
        createLog({
            req,
            logType: 'accounts',
            actionType: 'access-control-failure',
            notes: `Unauthenticated request to ${req.method} ${req.originalUrl}`
        });
        return res.status(401).json({ error: "Unauthorized access. Please log in." });
    }
    // check role
    if (req.session.role !== "admin") {
        createLog({
            req,
            logType: 'accounts',
            actionType: 'access-control-failure',
            notes: `Non-admin (${req.session.role}) attempted ${req.method} ${req.originalUrl}`
        });
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

// 2.1.8 — security answers just need a sane minimum length; we deliberately
// don't impose a stock list of questions (those tend to be low-entropy —
// "favorite book" -> "The Bible"). The question is user-authored instead.
const MIN_SECURITY_ANSWER_LENGTH = 4;
const validateSecurityAnswer = (answer) => {
    if (typeof answer !== "string" || answer.trim().length < MIN_SECURITY_ANSWER_LENGTH) {
        return `Security answer must be at least ${MIN_SECURITY_ANSWER_LENGTH} characters long.`;
    }
    if (answer.length > 200) {
        return "Security answer is too long.";
    }
    return null;
};

module.exports = {
    hashPassword,
    validatePasswordPolicy,
    validateSecurityAnswer,
    PASSWORD_MIN_LENGTH,
    requireAuth,
    requireAdmin
};
