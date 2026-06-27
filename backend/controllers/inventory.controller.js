const InventoryModel = require("../models/inventory.model");
const { createLog } = require("./logs.controller");

const createItem = async (req, res) => {
    try {
        const {
            itemName,
            itemType,
            measurementUnit,
            startingStock,
            lowStockThreshold
        } = req.body;

        // Validation
        if (
            !itemName ||
            !itemType ||
            !measurementUnit ||
            startingStock === undefined ||
            lowStockThreshold === undefined
        ) {
            return res.status(400).json({
                error: "All fields are required"
            });
        }

        // EC14 / EC16 — reject negative starting stock and negative thresholds
        if (startingStock < 0) {
            return res.status(400).json({ error: "Starting stock cannot be negative" });
        }
        if (lowStockThreshold < 0) {
            return res.status(400).json({ error: "Low stock threshold cannot be negative" });
        }

        // EC11 — block duplicate item names (case-insensitive)
        const existing = await InventoryModel.findOne({
            itemName: { $regex: `^${itemName.trim()}$`, $options: 'i' }
        });
        if (existing) {
            return res.status(409).json({ error: "An item with this name already exists" });
        }

        // Create item
        const newItem = new InventoryModel({
            itemName,
            itemType,
            measurementUnit,
            startingStock,
            lowStockThreshold,
            createdBy: req.session.email, // works with current system
            createdAt: new Date()
        });

        await newItem.save();

        // Audit log — item creation
        await createLog({
            req,
            logType: 'inventory',
            actionType: 'create-item',
            itemId: newItem._id.toString(),
            itemName: newItem.itemName,
            previousStock: 0,
            newStock: newItem.currentStock,
            measurementUnit: newItem.measurementUnit,
            notes: 'Item created'
        });

        return res.status(201).json({
            message: "Item created successfully",
            item: {
                id: newItem._id,
                itemName: newItem.itemName,
                itemType: newItem.itemType,
                measurementUnit: newItem.measurementUnit,
                startingStock: newItem.startingStock,
                lowStockThreshold: newItem.lowStockThreshold,
                createdBy: newItem.createdBy,
                createdAt: newItem.createdAt
            }
        });

    } catch (error) {
        console.error("Error creating item:", error);

        return res.status(500).json({
            error: "Error creating item"
        });
    }
};

// GET ITEMS API
const getItems = async (req, res) => {
    try {
        const items = await InventoryModel.find();
        return res.status(200).json(items);
    } catch (error) {
        console.error("Error fetching items:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// SEARCH ITEMS API
const searchItems = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const items = await InventoryModel.find({
            itemName: { $regex: query, $options: 'i' }
        });

        return res.status(200).json(items);
    } catch (error) {
        console.error("Error searching items:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// EDIT ITEM DETAILS API
const updateItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const updateData = req.body;

        if (updateData.startingStock !== undefined && updateData.startingStock < 0) {
            return res.status(400).json({ error: "Starting stock cannot be negative" });
        }
        if (updateData.lowStockThreshold !== undefined && updateData.lowStockThreshold < 0) {
            return res.status(400).json({ error: "Low stock threshold cannot be negative" });
        }

        const existingItem = await InventoryModel.findById(itemId);
        if (!existingItem) {
            return res.status(404).json({ error: "Item not found" });
        }

        const updatedItem = await InventoryModel.findByIdAndUpdate(
            itemId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ error: "Item not found" });
        }

        // Audit log — item details edited (EC57 needs old value traceable)
        await createLog({
            req,
            logType: 'inventory',
            actionType: 'edit-item',
            itemId: updatedItem._id.toString(),
            itemName: updatedItem.itemName,
            previousStock: existingItem.currentStock,
            newStock: updatedItem.currentStock,
            measurementUnit: updatedItem.measurementUnit,
            notes: `Edited fields: ${Object.keys(updateData).join(', ')}`
        });

        return res.status(200).json({
            message: "Item updated successfully",
            item: updatedItem
        });

    } catch (error) {
        console.error("Error updating item:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const updateStock = async (req, res) => {
    const itemId = req.params.id;
    const { actionType, quantityChanged, notes = '' } = req.body;

    try {
        // EC23 — only numeric, positive quantities accepted
        if (typeof quantityChanged !== 'number' || isNaN(quantityChanged) || quantityChanged <= 0) {
            return res.status(400).json({ error: "Quantity must be a positive number" });
        }

        const item = await InventoryModel.findById(itemId);
        if (!item) {
            return res.status(404).json({ error: "Item not found" });
        }

        let newStock;
        if (actionType === 'restock') {
            newStock = item.currentStock + quantityChanged;
        } else if (actionType === 'used-today') {
            newStock = item.currentStock - quantityChanged;
        } else {
            return res.status(400).json({ error: "Invalid actionType" });
        }

        // EC21 — reject deductions that would go below 0 instead of silently
        // clamping to 0. Clamping hides real usage and breaks accountability.
        if (newStock < 0) {
            return res.status(400).json({
                error: `Cannot deduct ${quantityChanged} ${item.measurementUnit} — only ${item.currentStock} ${item.measurementUnit} in stock.`
            });
        }

        const previousStock = item.currentStock;

        const updatedItem = await InventoryModel.findByIdAndUpdate(
            itemId,
            { currentStock: newStock },
            { new: true }
        );

        // Audit log — every stock change is tracked (the client's core ask)
        await createLog({
            req,
            logType: 'inventory',
            actionType,
            itemId: updatedItem._id.toString(),
            itemName: updatedItem.itemName,
            quantityChanged,
            previousStock,
            newStock,
            measurementUnit: updatedItem.measurementUnit,
            notes
        });

        return res.status(200).json({
            message: "Stock updated successfully",
            item: updatedItem
        });
    } catch (error) {
        console.error("Error updating stock:", error);
        return res.status(500).json({ error: "Error updating stock" });
    }
};

const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const deletedItem = await InventoryModel.findByIdAndDelete(itemId);

        if (!deletedItem) {
            return res.status(404).json({ error: "Item not found" });
        }

        // Audit log — item deletion (EC41: must capture item name, action,
        // admin account, IP, and time — all captured here)
        await createLog({
            req,
            logType: 'inventory',
            actionType: 'delete-item',
            itemId: deletedItem._id.toString(),
            itemName: deletedItem.itemName,
            previousStock: deletedItem.currentStock,
            newStock: 0,
            measurementUnit: deletedItem.measurementUnit,
            notes: 'Item deleted'
        });

        return res.status(200).json({
            message: "Item deleted successfully",
            item: deletedItem
        });
    } catch (error) {
        console.error("Error deleting item:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    createItem,
    getItems,
    searchItems,
    updateItem,
    updateStock,
    deleteItem
};
