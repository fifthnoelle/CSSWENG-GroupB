const LogsModel = require("../models/logs.model");

/**
 * Internal helper — NOT an Express route handler.
 * Call this from inventory.controller.js / user.controller.js whenever a
 * tracked action happens (stock change, item create/edit/delete, account
 * create/edit/delete). This is the audit trail the client specifically
 * asked for (accountability for who changed what, when, and why).
 *
 * Logging failures must never block the action that triggered them, so
 * this function swallows its own errors after printing them — see
 * EC43 in the QA doc for the policy discussion on log-write failures.
 *
 * Bug fix: this used to read `req.ip` / `req.headers['x-forwarded-for']`
 * without any guard. Several call sites in user.controller.js (login,
 * resetPasswordWithAnswer) pass a synthetic `{ session: {...} }` object
 * instead of the real Express `req`, because the real session isn't
 * populated yet at that point in the flow. That synthetic object has no
 * `.headers`, so `req.headers['x-forwarded-for']` threw a TypeError —
 * caught by the try/catch below and silently logged to the console, which
 * meant the log entry was never actually saved. Every login-success,
 * login-failed, account-locked, and password-reset event was silently
 * missing from the audit trail (and, downstream, the Account Activity
 * report always showed zero activity).
 *
 * Fixed by using optional chaining throughout, and by accepting explicit
 * actorId/actorName overrides so callers can pass the REAL req (for a
 * correct ip/headers) while still attributing the log to a specific user
 * even when req.session isn't populated yet.
 */
async function createLog({
    req,
    logType,            // 'inventory' | 'accounts'
    actionType,         // e.g. 'used-today' | 'restock' | 'create-item' | 'edit-item' | 'delete-item' | 'restore-item' | 'create-user' | 'edit-user' | 'delete-user' | 'edit-role'
    itemId = '',
    itemName = '',
    userTarget = '',
    userTargetName = '',
    quantityChanged = 0,
    previousStock = 0,
    newStock = 0,
    measurementUnit = '',
    notes = '',
    // Optional overrides for the acting user's identity. Used when the
    // action happens before req.session is populated — e.g. any login
    // attempt (successful or not), where the session literally doesn't
    // exist yet at the point the log needs to be written.
    actorId,
    actorName
}) {
    try {
        const log = new LogsModel({
            userId: actorId ? actorId.toString() : (req?.session?.userId || 'unknown'),
            userName: actorName || req?.session?.email || 'unknown',
            logType,
            actionType,
            itemId,
            itemName,
            userTarget,
            userTargetName,
            quantityChanged,
            previousStock,
            newStock,
            measurementUnit,
            notes,
            ipAddress: req?.ip || req?.headers?.['x-forwarded-for'] || '',
            actionTime: new Date()
        });
        await log.save();
    } catch (error) {
        // Don't let a logging failure break the underlying action.
        console.error("Error writing audit log:", error);
    }
}

// GET /logs — Admin/Owner only (route-gated). Supports filtering & sorting.
// Query params: logType, itemId, userId, actionType, startDate, endDate,
//               sort ('asc'|'desc', default 'desc'), page, limit
const getLogs = async (req, res) => {
    try {
        const {
            logType,
            itemId,
            userId,
            actionType,
            startDate,
            endDate,
            sort = 'desc',
            page = 1,
            limit = 50
        } = req.query;

        const filter = {};
        if (logType) filter.logType = logType;
        if (itemId) filter.itemId = itemId;
        if (userId) filter.userId = userId;
        if (actionType) filter.actionType = actionType;

        if (startDate || endDate) {
            filter.actionTime = {};
            if (startDate) filter.actionTime.$gte = new Date(startDate);
            if (endDate) {
                // Feature: the Logs page's new date-range filter passes a
                // plain YYYY-MM-DD value from a <input type="date">, which
                // parses to midnight UTC — without this, an end date of
                // "today" would exclude every entry from today. Treat the
                // end date as inclusive of the whole day.
                const endOfDay = new Date(endDate);
                endOfDay.setHours(23, 59, 59, 999);
                filter.actionTime.$lte = endOfDay;
            }
        }

        const pageNum = Math.max(parseInt(page, 10) || 1, 1);
        const limitNum = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200);

        const [logs, total] = await Promise.all([
            LogsModel.find(filter)
                .sort({ actionTime: sort === 'asc' ? 1 : -1 })
                .skip((pageNum - 1) * limitNum)
                .limit(limitNum),
            LogsModel.countDocuments(filter)
        ]);

        return res.status(200).json({
            logs,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error("Error fetching logs:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// GET /logs/item/:itemId — convenience endpoint for an item's full history
const getLogsByItem = async (req, res) => {
    try {
        const { itemId } = req.params;
        const logs = await LogsModel.find({ itemId }).sort({ actionTime: -1 });
        return res.status(200).json(logs);
    } catch (error) {
        console.error("Error fetching item logs:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    createLog,
    getLogs,
    getLogsByItem
};
