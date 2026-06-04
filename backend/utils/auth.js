const bcrypt = require("bcrypt");

//Utility function to hash passwords
//TODO: IMPLEMENT - Call this function when saving user passwords in register() controller
const hashPassword = (password) => {
    return bcrypt.hash(password, 10);
};

//Middleware to check if user is admin
//TODO: IMPLEMENT - Ensure req.session.role is set during login. This middleware protects admin routes.

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized access. Please log in." });
    }
    next();
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
    // check if user is logged in
    if (!req.session.userId) {
        return res.status(401).json({ error: "Unauthorized access. Please log in." });
    }
    // check role 
    if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

module.exports = { 
    hashPassword,
    requireAuth,
    requireAdmin
};