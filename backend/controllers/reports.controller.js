const InventoryModel = require("../models/inventory.model");
const LogsModel = require("../models/logs.model");

/**
 * GET /reports/monthly-summary?month=YYYY-MM
 * Implements US-A5: "see a monthly summary of beginning inventory, purchases,
 * usage, and ending stock so that I can accurately calculate costs and plan
 * for upcoming events."
 *
 * Beginning inventory for the month = currentStock as of the last log
 * BEFORE the month started (falls back to the item's startingStock if there
 * is no earlier log, i.e. the item didn't exist yet).
 * Purchases = sum of 'restock' quantityChanged within the month.
 * Usage = sum of 'used-today' quantityChanged within the month.
 * Ending stock = currentStock as of the last log within the month
 * (equivalently beginning + purchases - usage).
 */
const getMonthlySummary = async (req, res) => {
    try {
        const { month } = req.query; // expected format: "YYYY-MM"

        const now = new Date();
        const targetMonth = month
            ? new Date(`${month}-01T00:00:00.000Z`)
            : new Date(now.getFullYear(), now.getMonth(), 1);

        if (isNaN(targetMonth.getTime())) {
            return res.status(400).json({ error: "Invalid month format. Use YYYY-MM." });
        }

        const startOfMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
        const startOfNextMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth() + 1, 1);

        const items = await InventoryModel.find();

        const summary = await Promise.all(items.map(async (item) => {
            const itemId = item._id.toString();

            // Last log strictly before this month started -> beginning-of-month stock
            const lastLogBeforeMonth = await LogsModel.findOne({
                itemId,
                logType: 'inventory',
                actionTime: { $lt: startOfMonth }
            }).sort({ actionTime: -1 });

            const beginningStock = lastLogBeforeMonth
                ? lastLogBeforeMonth.newStock
                : item.startingStock;

            // All inventory logs within the month, oldest first
            const monthLogs = await LogsModel.find({
                itemId,
                logType: 'inventory',
                actionTime: { $gte: startOfMonth, $lt: startOfNextMonth }
            }).sort({ actionTime: 1 });

            let purchases = 0;
            let usage = 0;
            for (const log of monthLogs) {
                if (log.actionType === 'restock') purchases += log.quantityChanged;
                else if (log.actionType === 'used-today') usage += log.quantityChanged;
            }

            const endingStock = monthLogs.length > 0
                ? monthLogs[monthLogs.length - 1].newStock
                : beginningStock; // no activity this month -> unchanged

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

        return res.status(200).json({
            month: `${startOfMonth.getFullYear()}-${String(startOfMonth.getMonth() + 1).padStart(2, '0')}`,
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
 * "Used" is interpreted strictly as deduction activity, not restocks —
 * an item can be restocked regularly while still not actually selling.
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
