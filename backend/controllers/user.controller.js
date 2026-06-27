//ALL USER RELATED CONTROLLER FUNCTIONS
const UsersModel = require("../models/user.model");
const { hashPassword } = require("../utils/auth");
const { createLog } = require("./logs.controller");
const bcrypt = require("bcrypt");

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 1000 * 60 * 15; // 15 minute lockout, adjust as needed

/*
    TODO:
    - update user details (admin only)
    - delete user (admin only)
*/
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await UsersModel.findOne({ email });

        if (!user) {
            return res.status(401).json({ error: "Invalid email" });
        }

        // US-B1 AC: lock the account after 5+ failed attempts in a row.
        // EC6/EC7-adjacent: lockout is time-based here rather than requiring
        // a key code from the Ops Manager, since that flow is still listed
        // as optional/Phase 4 in the dev planning doc.
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            return res.status(403).json({
                error: "Account locked due to too many failed login attempts. Please contact your administrator or try again later.",
                lockedUntil: user.lockedUntil
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;

            let lockedOut = false;
            if (user.failedLoginAttempts >= MAX_FAILED_ATTEMPTS) {
                user.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
                lockedOut = true;

                await createLog({
                    req: { session: { userId: user._id, email: user.email } },
                    logType: 'accounts',
                    actionType: 'account-locked',
                    userTarget: user._id.toString(),
                    userTargetName: `${user.firstName} ${user.lastName}`,
                    notes: `Account locked after ${user.failedLoginAttempts} failed login attempts`
                });
            }

            await user.save();

            if (lockedOut) {
                return res.status(403).json({
                    error: "Too many failed attempts. Your account has been locked. Please contact your administrator.",
                    lockedUntil: user.lockedUntil
                });
            }

            // Offer an escape hatch after 2-3 failed attempts, per client request
            const attemptsLeft = MAX_FAILED_ATTEMPTS - user.failedLoginAttempts;
            return res.status(401).json({
                error: "Invalid password",
                attemptsLeft,
                showContactHigherUps: user.failedLoginAttempts >= 2
            });
        }

        // Successful login — reset the failed-attempt counter
        if (user.failedLoginAttempts || user.lockedUntil) {
            user.failedLoginAttempts = 0;
            user.lockedUntil = null;
            await user.save();
        }

        req.session.email = user.email;
        req.session.role = user.role;
        req.session.userId = user._id;

        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({ error: "Failed to save session" });
            }
            return res.status(200).json({ message: "Successful login", role: user.role });
        });

    } catch (error) {
        console.error("Error in login:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const home = (req, res) => {
    res.status(200).json({ status: "OK", message: "RiceEnroll backend is running" });
};

const logout = async (req, res) => {
    try {
        req.session.destroy((err) => {
            if (err) {
                console.error("Error destroying session:", err);
                return res.status(500).json({ error: "Error logging out" });
            }
            res.redirect("/");
        });
    } catch (error) {
        console.error("Error in logout:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// getUser API to fetch currently logged-in user's details
const getUser = async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }

        const user = await UsersModel.findById(req.session.userId).select("-password");

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        return res.status(200).json(user);
    } catch (error) {
        console.error("Error in getUser:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await UsersModel.find().select("-password");
        return res.status(200).json(users);
    } catch (error) {
        console.error("Error in getAllUsers:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

//ADMIN ONLY
//Only admin can register new users. Route protected by admin authentication middleware in auth.js
const register = async (req, res) => {
    try {
        const { email, firstName, lastName, password, role } = req.body;

        if (!email || !firstName || !lastName || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }

        const existingUser = await UsersModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists with the same email" });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = new UsersModel({
            email,
            firstName,
            lastName,
            password: hashedPassword,
            role: role || 'staff'
        });

        await newUser.save();
        console.log("User created successfully:", email);

        // Audit log — account creation (US-B6)
        await createLog({
            req,
            logType: 'accounts',
            actionType: 'create-user',
            userTarget: newUser._id.toString(),
            userTargetName: `${newUser.firstName} ${newUser.lastName}`,
            notes: `Created account with role: ${newUser.role}`
        });

        res.status(201).json({
            message: "User created successfully",
            id: newUser._id,
            email: newUser.email
        });

    } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).json({ error: "Error creating user" });
    }
};

//ADMIN ONLY
//Update an existing user's details. Password is optional — only updated if provided.
const updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { email, firstName, lastName, role, password } = req.body;

        if (!email || !firstName || !lastName) {
            return res.status(400).json({ error: "Email, first name, and last name are required" });
        }

        const existingUser = await UsersModel.findOne({ email, _id: { $ne: userId } });
        if (existingUser) {
            return res.status(409).json({ error: "Another user already has this email" });
        }

        const targetBeforeUpdate = await UsersModel.findById(userId);
        if (!targetBeforeUpdate) {
            return res.status(404).json({ error: "User not found" });
        }

        // EC55 — system must always retain at least one Admin
        if (targetBeforeUpdate.role === 'admin' && role === 'staff') {
            const adminCount = await UsersModel.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ error: "Cannot demote the last remaining Admin account." });
            }
        }

        const updateFields = { email, firstName, lastName, role: role || 'staff' };

        if (password && password.trim() !== '') {
            updateFields.password = await hashPassword(password);
        }

        const updatedUser = await UsersModel.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Audit log — distinguish a role change from a general profile edit
        const roleChanged = targetBeforeUpdate.role !== updatedUser.role;
        await createLog({
            req,
            logType: 'accounts',
            actionType: roleChanged ? 'edit-role' : 'edit-user',
            userTarget: updatedUser._id.toString(),
            userTargetName: `${updatedUser.firstName} ${updatedUser.lastName}`,
            notes: roleChanged
                ? `Role changed: ${targetBeforeUpdate.role} -> ${updatedUser.role}`
                : 'Account details updated'
        });

        return res.status(200).json({
            message: "User updated successfully",
            user: updatedUser
        });

    } catch (error) {
        console.error("Error in updateUser:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// deleteUser API to remove a user from the database
const deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent the admin from deleting their own account while logged in
        if (req.session.userId === userId) {
            return res.status(400).json({ error: "You cannot delete your own active session account." });
        }

        const targetUser = await UsersModel.findById(userId);
        if (!targetUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // EC55 — system must always retain at least one Admin
        if (targetUser.role === 'admin') {
            const adminCount = await UsersModel.countDocuments({ role: 'admin' });
            if (adminCount <= 1) {
                return res.status(400).json({ error: "Cannot delete the last remaining Admin account." });
            }
        }

        const deletedUser = await UsersModel.findByIdAndDelete(userId);

        // Audit log — account deletion
        await createLog({
            req,
            logType: 'accounts',
            actionType: 'delete-user',
            userTarget: deletedUser._id.toString(),
            userTargetName: `${deletedUser.firstName} ${deletedUser.lastName}`,
            notes: `Deleted account with role: ${deletedUser.role}`
        });

        return res.status(200).json({
            message: "User deleted successfully",
            id: deletedUser._id
        });

    } catch (error) {
        console.error("Error in deleteUser:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

const searchUsers = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const users = await UsersModel.find({
            $or: [
                { firstName: { $regex: query, $options: 'i' } },
                { lastName: { $regex: query, $options: 'i' } },
                { email: { $regex: query, $options: 'i' } },
                { role: { $regex: query, $options: 'i' } }
            ]
        }).select("-password");

        return res.status(200).json(users);
    } catch (error) {
        console.error("Error in searchUser:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

//Exports for routes
module.exports = {
    login,
    home,
    register,
    logout,
    getUser,
    deleteUser,
    getAllUsers,
    searchUsers,
    updateUser
};
