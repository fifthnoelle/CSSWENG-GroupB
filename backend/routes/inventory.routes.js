const express = require("express");
const router = express.Router();

const {
    createItem,
    getItems,
    searchItems,
    updateItem
} = require("../controllers/inventory.controller");

// Import the authentication middleware we made earlier
const { requireAuth } = require("../utils/auth");

// Apply requireAuth to ALL inventory routes automatically
router.use(requireAuth); 

// POST /inventory (Create an item)
router.post("/", createItem);

// GET /inventory (Get all items)
router.get("/", getItems);

// GET /inventory/search?query=xyz (Search items)
// Note: Put this ABOVE the /:id route, otherwise Express might think "search" is an ID!
router.get("/search", searchItems);

// PUT /inventory/:id (Edit an item)
router.put("/:id", updateItem);

module.exports = router;
