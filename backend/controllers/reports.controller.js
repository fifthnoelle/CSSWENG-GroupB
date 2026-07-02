const InventoryModel = require("../models/inventory.model");
const LogsModel = require("../models/logs.model");

// Shared by every report endpoint that accepts either a `month` or an
// explicit `startDate`/`endDate` custom range. Throws a RangeError with a
// user-facing message on bad input — callers turn that into a 400.
function resolveDateRange({ month, startDate, endDate }) {
    let rangeStart;
    let rangeEnd; // exclusive upper bound

    if (startDate || endDate) {
        if (!startDate || !endDate) {
            throw new RangeError("Both startDate and endDate are required for a custom range.");
        }
        rangeStart = new Date(`${startDate}T00:00:00.000`);
        const endDateExclusive = new Date(`${endDate}T00:00:00.000`);
        endDateExclusive.setDate(endDateExclusive.getDate() + 1);
        rangeEnd = endDateExclusive;

        if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
            throw new RangeError("Invalid date format. Use YYYY-MM-DD.");
        }
        if (rangeStart >= rangeEnd) {
            throw new RangeError("startDate must be before endDate.");
        }
    } else {
        const now = new Date();
        const targetMonth = month
            ? new Date(`${month}-01T00:00:00.000Z`)
            : new Date(now.getFullYear(), now.getMonth(), 1);

        if (isNaN(targetMonth.getTime())) {
            throw new RangeError("Invalid month format. Use YYYY-MM.");
        }

        rangeStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
        rangeEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1);
    }

    return { rangeStart, rangeEnd };
}

/**
 * GET /reports/monthly-summary?month=YYYY-MM
 * GET /reports/monthly-summary?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Implements US-A5: "see a monthly summary of beginning inventory, purchases,
 * usage, and ending stock so that I can accurately calculate costs and plan
 * for upcoming events."
 *
 * Accepts either a `month` (the default month-end reconciliation view the
 * client actually asked for) OR an explicit `startDate`/`endDate` range for
 * anyone who wants a custom window instead of a full calendar month.
 * If both are omitted, defaults to the current calendar month.
 */
const getMonthlySummary = async (req, res) => {
    try {
        const { month, startDate, endDate } = req.query;

        let rangeStart, rangeEnd;
        try {
            ({ rangeStart, rangeEnd } = resolveDateRange({ month, startDate, endDate }));
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        const items = await InventoryModel.find();

        // Skip items that weren't created yet as of the end of this range —
        // otherwise a brand-new item shows up (with its current startingStock)
        // even in a report for a period entirely before it existed.
        const relevantItems = items.filter(item => item.createdAt < rangeEnd);

        const summary = await Promise.all(relevantItems.map(async (item) => {
            const itemId = item._id.toString();

            const lastLogBeforeRange = await LogsModel.findOne({
                itemId,
                logType: 'inventory',
                actionTime: { $lt: rangeStart }
            }).sort({ actionTime: -1 });

            // If there's no log before the range, the item's own create-item
            // log (which always exists) would have satisfied this query had
            // the item existed before rangeStart — so its absence means the
            // item was created ON OR AFTER rangeStart, and its stock at the
            // start of this period was 0, not its (current) startingStock.
            const beginningStock = lastLogBeforeRange
                ? lastLogBeforeRange.newStock
                : 0;

            const rangeLogs = await LogsModel.find({
                itemId,
                logType: 'inventory',
                actionTime: { $gte: rangeStart, $lt: rangeEnd }
            }).sort({ actionTime: 1 });

            let purchases = 0;
            let usage = 0;
            for (const log of rangeLogs) {
                if (log.actionType === 'restock') purchases += log.quantityChanged;
                else if (log.actionType === 'used-today') usage += log.quantityChanged;
                // Item creation counts as an initial "purchase" too, so
                // beginning + purchases - usage reconciles to ending stock.
                else if (log.actionType === 'create-item') purchases += (log.newStock - log.previousStock);
            }

            const endingStock = rangeLogs.length > 0
                ? rangeLogs[rangeLogs.length - 1].newStock
                : beginningStock;

            return {
                itemId,
                itemName: item.itemName,
                itemType: item.itemType,
                measurementUnit: item.measurementUnit,
                beginningStock,
                purchases,
                usage,
                endingStock
            };
        }));

        const inclusiveEnd = new Date(rangeEnd.getTime() - 1);

        return res.status(200).json({
            month: month || `${rangeStart.getFullYear()}-${String(rangeStart.getMonth() + 1).padStart(2, '0')}`,
            startDate: rangeStart.toISOString().slice(0, 10),
            endDate: inclusiveEnd.toISOString().slice(0, 10),
            items: summary
        });
    } catch (error) {
        console.error("Error generating monthly summary:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

/**
 * GET /reports/inactive-items?days=30
 * US-A8: alert when an item has not been used (no 'used-today' log) in
 * over a month, so the owner can decide whether to keep stocking it.
 */
const getInactiveItems = async (req, res) => {
    try {
        const days = parseInt(req.query.days, 10) || 30;
        const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

        const items = await InventoryModel.find();

        const results = await Promise.all(items.map(async (item) => {
            const itemId = item._id.toString();
            const lastUsage = await LogsModel.findOne({
                itemId,
                actionType: 'used-today'
            }).sort({ actionTime: -1 });

            const lastUsedAt = lastUsage ? lastUsage.actionTime : null;
            const isInactive = !lastUsedAt || lastUsedAt < cutoff;

            return {
                itemId,
                itemName: item.itemName,
                measurementUnit: item.measurementUnit,
                lastUsedAt,
                isInactive
            };
        }));

        return res.status(200).json(results.filter(r => r.isInactive));
    } catch (error) {
        console.error("Error checking inactive items:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

function logToEvent(log) {
    return {
        actionTime: log.actionTime,
        actionType: log.actionType,
        userName: log.userName,
        userTargetName: log.userTargetName,
        notes: log.notes
    };
}

/**
 * GET /reports/account-activity?month=YYYY-MM
 * GET /reports/account-activity?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Login activity (successes, failures, lockouts — with a day-by-day trend)
 * and account changes (created, deleted, role changes) over a date range,
 * sourced from the accounts audit log (logType: 'accounts').
 */
const getAccountActivity = async (req, res) => {
    try {
        const { month, startDate, endDate } = req.query;

        let rangeStart, rangeEnd;
        try {
            ({ rangeStart, rangeEnd } = resolveDateRange({ month, startDate, endDate }));
        } catch (err) {
            return res.status(400).json({ error: err.message });
        }

        const logs = await LogsModel.find({
            logType: 'accounts',
            actionTime: { $gte: rangeStart, $lt: rangeEnd }
        }).sort({ actionTime: 1 });

        let totalSuccess = 0;
        let totalFailed = 0;
        let totalLockouts = 0;
        const byDayMap = new Map(); // 'YYYY-MM-DD' -> { date, success, failed }

        let created = 0;
        let deleted = 0;
        let roleChanges = 0;
        const events = [];

        for (const log of logs) {
            const dayKey = log.actionTime.toISOString().slice(0, 10);

            if (log.actionType === 'login-success') {
                totalSuccess++;
                const day = byDayMap.get(dayKey) || { date: dayKey, success: 0, failed: 0 };
                day.success++;
                byDayMap.set(dayKey, day);
            } else if (log.actionType === 'login-failed') {
                totalFailed++;
                const day = byDayMap.get(dayKey) || { date: dayKey, success: 0, failed: 0 };
                day.failed++;
                byDayMap.set(dayKey, day);
            } else if (log.actionType === 'account-locked') {
                totalLockouts++;
            }

            if (log.actionType === 'create-user') {
                created++;
                events.push(logToEvent(log));
            } else if (log.actionType === 'delete-user') {
                deleted++;
                events.push(logToEvent(log));
            } else if (log.actionType === 'edit-role') {
                roleChanges++;
                events.push(logToEvent(log));
            }
        }

        const byDay = Array.from(byDayMap.values()).sort((a, b) => a.date.localeCompare(b.date));
        events.sort((a, b) => new Date(b.actionTime) - new Date(a.actionTime)); // newest first

        const inclusiveEnd = new Date(rangeEnd.getTime() - 1);

        return res.status(200).json({
            startDate: rangeStart.toISOString().slice(0, 10),
            endDate: inclusiveEnd.toISOString().slice(0, 10),
            loginActivity: { totalSuccess, totalFailed, totalLockouts, byDay },
            accountChanges: { created, deleted, roleChanges, events }
        });
    } catch (error) {
        console.error("Error generating account activity report:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    getMonthlySummary,
    getInactiveItems,
    getAccountActivity
};
