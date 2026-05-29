const bcrypt = require("bcrypt");

//Utility function to hash passwords
//TODO: IMPLEMENT - Call this function when saving user passwords in register() controller
const hashPassword = (password) => {
    return bcrypt.hash(password, 10);
};

//Middleware to check if user is admin
//TODO: IMPLEMENT - Ensure req.session.role is set during login. This middleware protects admin routes.
const requireAdmin = (req, res, next) => {
    if (req.session.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
    }
    next();
};

module.exports = { 
    hashPassword,
    requireAdmin
};