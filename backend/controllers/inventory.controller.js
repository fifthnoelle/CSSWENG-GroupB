const mongoose = require("mongoose");
const InventoryModel = require("../models/inventory.model");
const { createLog } = require("./logs.controller");

const MAX_NAME_LENGTH = 100;
const MAX_TYPE_LENGTH = 50;
const MAX_UNIT_LENGTH = 20;
// 2.3.2 / 2.3.3 — allow-listed characters and max length for free-text fields.
// Anything outside this is REJECTED outright (never trimmed/sanitized then saved).
const TEXT_FIELD_PATTERN = /^[A-Za-z0-9 .,'&\-/]+$/;

function validateTextField(value, fieldLabel, maxLength) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        return `${fieldLabel} is required`;
    }
    if (value.length > maxLength) {
        return `${fieldLabel} must be at most ${maxLength} characters`;
    }
    if (!TEXT_FIELD_PATTERN.test(value)) {
        return `${fieldLabel} contains invalid characters`;
    }
    return null;
}

function validateNonNegativeNumber(value, fieldLabel) {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        return `${fieldLabel} must be a valid number`;
    }
    if (value < 0) {
        return `${fieldLabel} cannot be negative`;
    }
    return null;
}

function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function logValidationFailure(req, reason) {
    await createLog({
        req,
        logType: 'inventory',
        actionType: 'validation-failure',
        notes: reason
    });
}

const createItem = async (req, res) => {
    try {
        const {
            itemName,
            itemType,
            measurementUnit,
            startingStock,
            lowStockThreshold
        } = req.body;

        const errors = [
            validateTextField(itemName, "Item name", MAX_NAME_LENGTH),
            validateTextField(itemType, "Item type", MAX_TYPE_LENGTH),
            validateTextField(measurementUnit, "Measurement unit", MAX_UNIT_LENGTH),
            validateNonNegativeNumber(startingStock, "Starting stock"),
            validateNonNegativeNumber(lowStockThreshold, "Low stock threshold")
        ].filter(Boolean);

        if (errors.length) {
            await logValidationFailure(req, `createItem rejected: ${errors.join('; ')}`);
            return res.status(400).json({ error: errors[0] });
        }

        const existing = await InventoryModel.findOne({
            itemName: { $regex: `^${escapeRegex(itemName.trim())}$`, $options: 'i' }
        });
        if (existing) {
            return res.status(409).json({ error: "An item with this name already exists" });
        }

        const newItem = new InventoryModel({
            itemName,
            itemType,
            measurementUnit,
            startingStock,
            lowStockThreshold,
            createdBy: req.session.email,
            createdAt: new Date()
        });

        await newItem.save();

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
            item: newItem
        });

    } catch (error) {
        console.error("Error creating item:", error);
        return res.status(500).json({ error: "Error creating item" });
    }
};

const getItems = async (req, res) => {
    try {
        const items = await InventoryModel.find();
        return res.status(200).json(items);
    } catch (error) {
        console.error("Error fetching items:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const searchItems = async (req, res) => {
    try {
        const { query } = req.query;
        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }
        const items = await InventoryModel.find({
            itemName: { $regex: escapeRegex(query), $options: 'i' }
        });
        return res.status(200).json(items);
    } catch (error) {
        console.error("Error searching items:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

const updateItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const body = req.body;

        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(404).json({ error: "Item not found" });
        }

        const updateData = {};
        const errors = [];

        if (body.itemName !== undefined) {
            const err = validateTextField(body.itemName, "Item name", MAX_NAME_LENGTH);
            if (err) errors.push(err); else updateData.itemName = body.itemName;
        }
        if (body.itemType !== undefined) {
            const err = validateTextField(body.itemType, "Item type", MAX_TYPE_LENGTH);
            if (err) errors.push(err); else updateData.itemType = body.itemType;
        }
        if (body.measurementUnit !== undefined) {
            const err = validateTextField(body.measurementUnit, "Measurement unit", MAX_UNIT_LENGTH);
            if (err) errors.push(err); else updateData.measurementUnit = body.measurementUnit;
        }
        if (body.startingStock !== undefined) {
            const err = validateNonNegativeNumber(body.startingStock, "Starting stock");
            if (err) errors.push(err); else updateData.startingStock = body.startingStock;
        }
        if (body.lowStockThreshold !== undefined) {
            const err = validateNonNegativeNumber(body.lowStockThreshold, "Low stock threshold");
            if (err) errors.push(err); else updateData.lowStockThreshold = body.lowStockThreshold;
        }

        if (errors.length) {
            await logValidationFailure(req, `updateItem rejected: ${errors.join('; ')}`);
            return res.status(400).json({ error: errors[0] });
        }

        const existingItem = await InventoryModel.findById(itemId);
        if (!existingItem) {
            return res.status(404).json({ error: "Item not found" });
        }

        if (updateData.itemName !== undefined) {
            const duplicate = await InventoryModel.findOne({
                _id: { $ne: itemId },
                itemName: { $regex: `^${escapeRegex(updateData.itemName.trim())}$`, $options: 'i' }
            });
            if (duplicate) {
                return res.status(409).json({ error: "An item with this name already exists" });
            }
        }

        const updatedItem = await InventoryModel.findByIdAndUpdate(
            itemId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedItem) {
            return res.status(404).json({ error: "Item not found" });
        }

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
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(404).json({ error: "Item not found" });
        }

        if (typeof quantityChanged !== 'number' || isNaN(quantityChanged) || quantityChanged <= 0) {
            await logValidationFailure(req, `updateStock rejected: invalid quantityChanged (${JSON.stringify(quantityChanged)})`);
            return res.status(400).json({ error: "Quantity must be a positive number" });
        }

        if (actionType !== 'restock' && actionType !== 'used-today') {
            return res.status(400).json({ error: "Invalid actionType" });
        }

        // Bug fix (#4): this used to read item.currentStock, compute the
        // new value in JS, then write it back with a separate
        // findByIdAndUpdate call. Two concurrent requests updating the
        // same item could both read the same starting value, and the
        // second write would silently overwrite the first (a lost-update
        // race) even though both got logged as if they'd applied cleanly.
        // Using an atomic $inc — with a query-level guard for deductions —
        // means MongoDB applies the change against whatever the CURRENT
        // value is at the moment of the write, not a value read earlier,
        // so the race is gone and a deduction still can never take stock
        // below 0.
        const delta = actionType === 'restock' ? quantityChanged : -quantityChanged;
        const filter = { _id: itemId };
        if (actionType === 'used-today') {
            filter.currentStock = { $gte: quantityChanged };
        }

        const updatedItem = await InventoryModel.findOneAndUpdate(
            filter,
            { $inc: { currentStock: delta } },
            { new: true }
        );

        if (!updatedItem) {
            // Either the item doesn't exist, or (for a deduction) the guard
            // failed because current stock is now lower than requested —
            // re-fetch to tell the two cases apart for a clear error message.
            const existing = await InventoryModel.findById(itemId);
            if (!existing) {
                return res.status(404).json({ error: "Item not found" });
            }
            return res.status(400).json({
                error: `Cannot deduct ${quantityChanged} ${existing.measurementUnit} — only ${existing.currentStock} ${existing.measurementUnit} in stock.`
            });
        }

        const newStock = updatedItem.currentStock;
        const previousStock = newStock - delta;

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

        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(404).json({ error: "Item not found" });
        }

        const deletedItem = await InventoryModel.findByIdAndDelete(itemId);

        if (!deletedItem) {
            return res.status(404).json({ error: "Item not found" });
        }

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
