const express = require("express");
const router = express.Router();

const {
    createItem
} = require("../controllers/inventory.controller");

// POST /inventory
router.post("/", createItem);

module.exports = router;