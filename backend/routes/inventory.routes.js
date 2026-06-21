const express = require("express");
const router = express.Router();

const {
    createItem,
    getItems,
    searchItems,
    updateItem,
    updateStock,
    deleteItem
} = require("../controllers/inventory.controller");

const { requireAuth } = require("../utils/auth");

router.use(requireAuth);

// POST /inventory (Create an item)
router.post("/", createItem);

// GET /inventory (Get all items)
router.get("/", getItems);

// GET /inventory/search?query=xyz (Search items)
router.get("/search", searchItems);

// PATCH /inventory/:id (Update stock — matches frontend's inventory_service.ts)
router.patch("/:id", updateStock);

// PUT /inventory/:id (Edit item details)
router.put("/:id", updateItem);

// DELETE /inventory/:id (Delete item)
router.delete("/:id", deleteItem);

module.exports = router;
