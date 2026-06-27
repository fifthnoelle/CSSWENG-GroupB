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
 */
async function createLog({
    req,
    logType,            // 'inventory' | 'accounts'
    actionType,         // e.g. 'used-today' | 'restock' | 'create-item' | 'edit-item' | 'delete-item' | 'create-user' | 'edit-user' | 'delete-user' | 'edit-role'
    itemId = '',
    itemName = '',
    userTarget = '',
    userTargetName = '',
    quantityChanged = 0,
    previousStock = 0,
    newStock = 0,
    measurementUnit = '',
    notes = ''
}) {
    try {
        const log = new LogsModel({
            userId: req.session?.userId || 'unknown',
            userName: req.session?.email || 'unknown',
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
            ipAddress: req.ip || req.headers['x-forwarded-for'] || '',
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
            if (endDate) filter.actionTime.$lte = new Date(endDate);
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

// GET /logs/:itemId — convenience endpoint for an item's full history
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
