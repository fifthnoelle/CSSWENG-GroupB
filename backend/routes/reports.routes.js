const express = require("express");
const router = express.Router();

const { getMonthlySummary, getInactiveItems, getAccountActivity } = require("../controllers/reports.controller");
const { requireAdmin } = require("../utils/auth");

// Reports are an Admin/Owner-only feature per the master doc permissions table.
router.use(requireAdmin);

// GET /reports/monthly-summary?month=YYYY-MM
router.get("/monthly-summary", getMonthlySummary);

// GET /reports/inactive-items?days=30
router.get("/inactive-items", getInactiveItems);

// GET /reports/account-activity?month=YYYY-MM
router.get("/account-activity", getAccountActivity);

module.exports = router;
