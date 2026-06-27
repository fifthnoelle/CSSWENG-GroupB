const express = require("express");
const router = express.Router();

const { getLogs, getLogsByItem } = require("../controllers/logs.controller");
const { requireAdmin } = require("../utils/auth");

// Logs are an Admin/Owner-only feature per the master doc permissions table.
// EC42 (QA doc): staff attempting to hit this directly must be rejected
// server-side, not just hidden in the UI.
router.use(requireAdmin);

// GET /logs?logType=&itemId=&userId=&actionType=&startDate=&endDate=&sort=&page=&limit=
router.get("/", getLogs);

// GET /logs/item/:itemId — full history for one inventory item
router.get("/item/:itemId", getLogsByItem);

module.exports = router;
