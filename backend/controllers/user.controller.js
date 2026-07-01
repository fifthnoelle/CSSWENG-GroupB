//ALL USER RELATED CONTROLLER FUNCTIONS
const mongoose = require("mongoose");
const UsersModel = require("../models/user.model");
const { hashPassword, validatePasswordPolicy, validateSecurityAnswer } = require("../utils/auth");
const { createLog } = require("./logs.controller");
const bcrypt = require("bcrypt");

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 1000 * 60 * 15; // 15 minute lockout, adjust as needed
const MIN_PASSWORD_AGE_MS = 1000 * 60 * 60 * 24; // 2.1.10 — 1 day

// Force-logout helper — destroys every server-side session belonging to a
// user. req.session.role/email are cached at login time, so a role change
// (or account deletion) wouldn't otherwise take effect until that user's
// cookie naturally expires (up to 24h — see sessionConfig in app.js). This
// makes the change effective immediately: their next request finds no
// matching session, so requireAuth/requireAdmin reject it and they're
// bounced back to the login screen.
async function destroySessionsForUser(userId) {
    try {
        const db = mongoose.connection.db;
        if (!db) return;
        const sessionsCollection = db.collection('sessions');
        const allSessions = await sessionsCollection.find({}).toArray();
        const idsToDelete = [];
        for (const doc of allSessions) {
            let sessionData = doc.session;
            if (typeof sessionData === 'string') {
                try {
                    sessionData = JSON.parse(sessionData);
                } catch {
                    continue;
                }
            }
            if (sessionData && String(sessionData.userId) === String(userId)) {
                idsToDelete.push(doc._id);
            }
        }
        if (idsToDelete.length) {
            await sessionsCollection.deleteMany({ _id: { $in: idsToDelete } });
        }
    } catch (err) {
        console.error("Error destroying sessions for user:", err);
    }
}

/*
    TODO:
    - update user details (admin only)
    - delete user (admin only)
*/
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // 2.1.3 — generic message used for every failure case below, so the
        // response never reveals whether the email or the password was wrong.
        const GENERIC_FAIL = "Invalid email and/or password";

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }

        const user = await UsersModel.findOne({ email });

        if (!user) {
            // 2.4.5 — log failed attempts even when the account doesn't exist,
            // without revealing that fact to the caller.
            await createLog({
                req: { session: {} },
                logType: 'accounts',
                actionType: 'login-failed',
                userTargetName: email,
                notes: `Failed login attempt for unknown email: ${email}`
            });
            return res.status(401).json({ error: GENERIC_FAIL });
        }

        // US-B1 AC: lock the account after 5+ failed attempts in a row.
        if (user.lockedUntil && user.lockedUntil > new Date()) {
            await createLog({
                req: { session: { userId: user._id, email: user.email } },
                logType: 'accounts',
                actionType: 'login-failed',
                userTarget: user._id.toString(),
                userTargetName: `${user.firstName} ${user.lastName}`,
                notes: `Login attempt while account locked`
            });
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

            // 2.1.11 — record this failed attempt so it can be reported at next success
            user.lastLoginAt = new Date();
            user.lastLoginStatus = 'failed';
            user.lastLoginIp = req.ip || req.headers['x-forwarded-for'] || '';

            await user.save();

            // 2.4.5 — log every failed authentication attempt, including lockout
            if (!lockedOut) {
                await createLog({
                    req: { session: { userId: user._id, email: user.email } },
                    logType: 'accounts',
                    actionType: 'login-failed',
                    userTarget: user._id.toString(),
                    userTargetName: `${user.firstName} ${user.lastName}`,
                    notes: `Failed login attempt (${user.failedLoginAttempts}/${MAX_FAILED_ATTEMPTS})`
                });
            }

            if (lockedOut) {
                return res.status(403).json({
                    error: "Too many failed attempts. Your account has been locked. Please contact your administrator.",
                    lockedUntil: user.lockedUntil
                });
            }

            return res.status(401).json({ error: GENERIC_FAIL });
        }

        // Successful login — capture the previous login info to report back,
        // then reset counters and record this login.
        const previousLogin = {
            lastLoginAt: user.lastLoginAt,
            lastLoginStatus: user.lastLoginStatus,
            lastLoginIp: user.lastLoginIp
        };

        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        user.lastLoginAt = new Date();
        user.lastLoginStatus = 'success';
        user.lastLoginIp = req.ip || req.headers['x-forwarded-for'] || '';
        await user.save();

        // 2.4.5 — log successful authentication attempts too
        await createLog({
            req: { session: { userId: user._id, email: user.email } },
            logType: 'accounts',
            actionType: 'login-success',
            userTarget: user._id.toString(),
            userTargetName: `${user.firstName} ${user.lastName}`,
            notes: `Successful login`
        });

        req.session.email = user.email;
        req.session.role = user.role;
        req.session.userId = user._id;

        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({ error: "Failed to save session" });
            }
            // 2.1.11 — report the last use of the account (successful or not) at next login
            return res.status(200).json({
                message: "Successful login",
                role: user.role,
                previousLogin
            });
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
        const { email, firstName, lastName, password, role, securityQuestion, securityAnswer } = req.body;

        if (!email || !firstName || !lastName || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }
        if (!securityQuestion || !securityQuestion.trim()) {
            return res.status(400).json({ error: "A security question is required for password recovery" });
        }
        const answerError = validateSecurityAnswer(securityAnswer);
        if (answerError) {
            return res.status(400).json({ error: answerError });
        }

        const existingUser = await UsersModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ error: "User already exists with the same email" });
        }

        // 2.1.4 / 2.1.5 / 2.3.3 — enforce password complexity & length policy
        const policyError = validatePasswordPolicy(password);
        if (policyError) {
            return res.status(400).json({ error: policyError });
        }

        const hashedPassword = await hashPassword(password);
        const securityAnswerHash = await hashPassword(securityAnswer.trim());

        const newUser = new UsersModel({
            email,
            firstName,
            lastName,
            password: hashedPassword,
            passwordHistory: [hashedPassword],
            passwordChangedAt: new Date(),
            securityQuestion: securityQuestion.trim(),
            securityAnswerHash,
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
            const policyError = validatePasswordPolicy(password);
            if (policyError) {
                return res.status(400).json({ error: policyError });
            }
            const newHash = await hashPassword(password);
            updateFields.password = newHash;
            updateFields.passwordChangedAt = new Date();
            const existingHistory = targetBeforeUpdate.passwordHistory && targetBeforeUpdate.passwordHistory.length
                ? targetBeforeUpdate.passwordHistory
                : [targetBeforeUpdate.password];
            updateFields.passwordHistory = [...existingHistory, newHash].slice(-10);
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

        // A role change must take effect immediately, not whenever this
        // user's existing session cookie happens to expire — kill any
        // active session(s) they're currently signed in with.
        if (roleChanged) {
            await destroySessionsForUser(updatedUser._id.toString());
        }

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
        if (!deletedUser) {
            return res.status(404).json({ error: "User not found" });
        }

        // Audit log — account deletion
        await createLog({
            req,
            logType: 'accounts',
            actionType: 'delete-user',
            userTarget: deletedUser._id.toString(),
            userTargetName: `${deletedUser.firstName} ${deletedUser.lastName}`,
            notes: `Deleted account with role: ${deletedUser.role}`
        });

        // Don't leave a session usable for an account that no longer exists
        await destroySessionsForUser(deletedUser._id.toString());

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

// Self-service password change for the logged-in user (any role).
// 2.1.12 — re-authenticates via current password before allowing the change.
// 2.1.9 — rejects reuse of any password in the user's history.
// 2.1.10 — rejects changes within MIN_PASSWORD_AGE_MS of the last change.
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!req.session.userId) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: "Current and new password are required" });
        }

        const user = await UsersModel.findById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Re-authentication: must prove knowledge of current password
        const currentMatch = await bcrypt.compare(currentPassword, user.password);
        if (!currentMatch) {
            await createLog({
                req,
                logType: 'accounts',
                actionType: 'login-failed',
                userTarget: user._id.toString(),
                userTargetName: `${user.firstName} ${user.lastName}`,
                notes: 'Failed re-authentication during password change attempt'
            });
            return res.status(401).json({ error: "Current password is incorrect" });
        }

        // 2.1.10 — minimum password age
        if (user.passwordChangedAt && (Date.now() - user.passwordChangedAt.getTime()) < MIN_PASSWORD_AGE_MS) {
            return res.status(400).json({ error: "Your password was changed too recently. Please wait before changing it again." });
        }

        // 2.1.4 / 2.1.5 — complexity & length policy
        const policyError = validatePasswordPolicy(newPassword);
        if (policyError) {
            return res.status(400).json({ error: policyError });
        }

        // 2.1.9 — reject reuse against full password history (including current password)
        const history = user.passwordHistory && user.passwordHistory.length ? user.passwordHistory : [user.password];
        for (const oldHash of history) {
            if (await bcrypt.compare(newPassword, oldHash)) {
                return res.status(400).json({ error: "You cannot reuse a previous password." });
            }
        }

        const newHash = await hashPassword(newPassword);
        user.password = newHash;
        user.passwordHistory = [...history, newHash].slice(-10); // keep last 10
        user.passwordChangedAt = new Date();
        await user.save();

        await createLog({
            req,
            logType: 'accounts',
            actionType: 'edit-user',
            userTarget: user._id.toString(),
            userTargetName: `${user.firstName} ${user.lastName}`,
            notes: 'Password changed via self-service (re-authenticated)'
        });

        return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        console.error("Error in changePassword:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// PUBLIC — step 1 of password recovery: return the user's security question.
// Generic responses are used everywhere here to avoid leaking which emails exist.
const GENERIC_RECOVERY_FAIL = "If an account exists for this email with a security question set, you'll be able to continue. Otherwise, contact your administrator.";

const getSecurityQuestion = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const user = await UsersModel.findOne({ email });
        if (!user || !user.securityQuestion) {
            // Don't reveal whether the email exists at all.
            return res.status(404).json({ error: GENERIC_RECOVERY_FAIL });
        }

        if (user.securityAnswerLockedUntil && user.securityAnswerLockedUntil > new Date()) {
            return res.status(403).json({
                error: "Too many incorrect answers. Please try again later or contact your administrator.",
                lockedUntil: user.securityAnswerLockedUntil
            });
        }

        return res.status(200).json({ question: user.securityQuestion });
    } catch (error) {
        console.error("Error in getSecurityQuestion:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// PUBLIC — step 2: verify the answer and, if correct, set the new password.
// 2.1.9 — reject reuse against password history.
// Note: the 1-day minimum password age (2.1.10) is intentionally NOT enforced
// here — that rule exists to stop an attacker who already has the password
// from forcing churn; it shouldn't block a legitimate user who lost access.
const resetPasswordWithAnswer = async (req, res) => {
    try {
        const { email, securityAnswer, newPassword } = req.body;
        if (!email || !securityAnswer || !newPassword) {
            return res.status(400).json({ error: "Email, security answer, and new password are required" });
        }

        const user = await UsersModel.findOne({ email });
        if (!user || !user.securityQuestion) {
            return res.status(404).json({ error: GENERIC_RECOVERY_FAIL });
        }

        if (user.securityAnswerLockedUntil && user.securityAnswerLockedUntil > new Date()) {
            return res.status(403).json({
                error: "Too many incorrect answers. Please try again later or contact your administrator.",
                lockedUntil: user.securityAnswerLockedUntil
            });
        }

        const answerMatch = await bcrypt.compare(securityAnswer.trim(), user.securityAnswerHash);
        if (!answerMatch) {
            user.securityAnswerAttempts = (user.securityAnswerAttempts || 0) + 1;
            let lockedOut = false;
            if (user.securityAnswerAttempts >= MAX_FAILED_ATTEMPTS) {
                user.securityAnswerLockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
                lockedOut = true;
            }
            await user.save();

            await createLog({
                req: { session: { userId: user._id, email: user.email } },
                logType: 'accounts',
                actionType: 'login-failed',
                userTarget: user._id.toString(),
                userTargetName: `${user.firstName} ${user.lastName}`,
                notes: lockedOut
                    ? `Security answer locked after ${user.securityAnswerAttempts} failed attempts`
                    : `Failed password-reset security answer attempt (${user.securityAnswerAttempts}/${MAX_FAILED_ATTEMPTS})`
            });

            return res.status(401).json({ error: GENERIC_RECOVERY_FAIL });
        }

        // 2.1.4 / 2.1.5 — complexity & length policy
        const policyError = validatePasswordPolicy(newPassword);
        if (policyError) {
            return res.status(400).json({ error: policyError });
        }

        // 2.1.9 — reject reuse against full password history
        const history = user.passwordHistory && user.passwordHistory.length ? user.passwordHistory : [user.password];
        for (const oldHash of history) {
            if (await bcrypt.compare(newPassword, oldHash)) {
                return res.status(400).json({ error: "You cannot reuse a previous password." });
            }
        }

        const newHash = await hashPassword(newPassword);
        user.password = newHash;
        user.passwordHistory = [...history, newHash].slice(-10);
        user.passwordChangedAt = new Date();

        // Identity is proven — clear login lockouts and answer-attempt counters too
        user.failedLoginAttempts = 0;
        user.lockedUntil = null;
        user.securityAnswerAttempts = 0;
        user.securityAnswerLockedUntil = null;
        await user.save();

        await createLog({
            req: { session: { userId: user._id, email: user.email } },
            logType: 'accounts',
            actionType: 'edit-user',
            userTarget: user._id.toString(),
            userTargetName: `${user.firstName} ${user.lastName}`,
            notes: 'Password reset via security question'
        });

        return res.status(200).json({ message: "Password reset successfully. Please log in with your new password." });
    } catch (error) {
        console.error("Error in resetPasswordWithAnswer:", error);
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
    updateUser,
    changePassword,
    getSecurityQuestion,
    resetPasswordWithAnswer
};
