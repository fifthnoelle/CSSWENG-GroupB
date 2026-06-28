const InventoryModel = require("../models/inventory.model");
const LogsModel = require("../models/logs.model");

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

        let rangeStart;
        let rangeEnd; // exclusive upper bound

        if (startDate || endDate) {
            if (!startDate || !endDate) {
                return res.status(400).json({ error: "Both startDate and endDate are required for a custom range." });
            }
            rangeStart = new Date(`${startDate}T00:00:00.000`);
            const endDateExclusive = new Date(`${endDate}T00:00:00.000`);
            endDateExclusive.setDate(endDateExclusive.getDate() + 1);
            rangeEnd = endDateExclusive;

            if (isNaN(rangeStart.getTime()) || isNaN(rangeEnd.getTime())) {
                return res.status(400).json({ error: "Invalid date format. Use YYYY-MM-DD." });
            }
            if (rangeStart >= rangeEnd) {
                return res.status(400).json({ error: "startDate must be before endDate." });
            }
        } else {
            const now = new Date();
            const targetMonth = month
                ? new Date(`${month}-01T00:00:00.000Z`)
                : new Date(now.getFullYear(), now.getMonth(), 1);

            if (isNaN(targetMonth.getTime())) {
                return res.status(400).json({ error: "Invalid month format. Use YYYY-MM." });
            }

            rangeStart = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
            rangeEnd = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1);
        }

        const items = await InventoryModel.find();

        const summary = await Promise.all(items.map(async (item) => {
            const itemId = item._id.toString();

            const lastLogBeforeRange = await LogsModel.findOne({
                itemId,
                logType: 'inventory',
                actionTime: { $lt: rangeStart }
            }).sort({ actionTime: -1 });

            const beginningStock = lastLogBeforeRange
                ? lastLogBeforeRange.newStock
                : item.startingStock;

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

module.exports = {
    getMonthlySummary,
    getInactiveItems
};
