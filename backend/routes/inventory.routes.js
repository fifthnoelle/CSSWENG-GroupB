const express = require("express");
const router = express.Router();

const {
    createItem,
    getItems,
    searchItems,
    updateItem,
    updateStock,
    deleteItem,
    restoreItem
} = require("../controllers/inventory.controller");

const { requireAuth, requireAdmin } = require("../utils/auth");

router.use(requireAuth);

// GET /inventory (Get all items; ?archived=true for the archived view) — staff + admin
router.get("/", getItems);

// GET /inventory/search?query=xyz (Search items; ?archived=true for the archived view) — staff + admin
router.get("/search", searchItems);

// POST /inventory (Create an item) — Admin/Owner only per permissions table
router.post("/", requireAdmin, createItem);

// PATCH /inventory/:id (Update stock) — staff + admin can both adjust stock
router.patch("/:id", updateStock);

// PUT /inventory/:id (Edit item details) — Admin/Owner only
router.put("/:id", requireAdmin, updateItem);

// DELETE /inventory/:id (Archive item) — Admin/Owner only
router.delete("/:id", requireAdmin, deleteItem);

// Feature: PATCH /inventory/:id/restore (Restore an archived item) — Admin/Owner only
router.patch("/:id/restore", requireAdmin, restoreItem);

module.exports = router;
