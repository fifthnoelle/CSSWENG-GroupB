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

// Escapes regex metacharacters in user-supplied search/name text before it's
// interpolated into a $regex filter, so characters like ( ) * + ? etc.
// can't break the query or degrade search/duplicate-check results.
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 2.4.4 — every validation failure is logged (out-of-range, bad characters, etc.)
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

        // 2.3.1 — reject on any validation failure; never silently sanitize/coerce.
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

        // EC11 — block duplicate item names (case-insensitive), among active
        // (non-archived) items only — an archived item's name is free to reuse.
        const existing = await InventoryModel.findOne({
            itemName: { $regex: `^${escapeRegex(itemName.trim())}$`, $options: 'i' },
            isArchived: { $ne: true }
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
            item: newItem
        });

    } catch (error) {
        console.error("Error creating item:", error);

        return res.status(500).json({
            error: "Error creating item"
        });
    }
};

// GET ITEMS API
// ?archived=true returns ONLY archived items (for the "Archived" view);
// otherwise archived items are excluded from the normal inventory list.
const getItems = async (req, res) => {
    try {
        const showArchived = req.query.archived === 'true';
        const filter = showArchived ? { isArchived: true } : { isArchived: { $ne: true } };
        const items = await InventoryModel.find(filter);
        return res.status(200).json(items);
    } catch (error) {
        console.error("Error fetching items:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// SEARCH ITEMS API
// ?archived=true searches within archived items instead of active ones.
const searchItems = async (req, res) => {
    try {
        const { query } = req.query;

        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        const showArchived = req.query.archived === 'true';
        const items = await InventoryModel.find({
            itemName: { $regex: escapeRegex(query), $options: 'i' },
            isArchived: showArchived ? true : { $ne: true }
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
        const body = req.body;

        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(404).json({ error: "Item not found" });
        }

        // Whitelist editable fields only — prevents a client from directly
        // overwriting currentStock, createdBy, _id, etc. via this endpoint.
        // Stock changes must go through updateStock() so they stay audited.
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

        // EC11 — block renaming into a duplicate (case-insensitive) among
        // active items, same rule createItem already enforces on creation.
        if (updateData.itemName !== undefined) {
            const duplicate = await InventoryModel.findOne({
                _id: { $ne: itemId },
                itemName: { $regex: `^${escapeRegex(updateData.itemName.trim())}$`, $options: 'i' },
                isArchived: { $ne: true }
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
        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(404).json({ error: "Item not found" });
        }

        // EC23 — only numeric, positive quantities accepted
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
        const filter = { _id: itemId, isArchived: { $ne: true } };
        if (actionType === 'used-today') {
            filter.currentStock = { $gte: quantityChanged };
        }

        const updatedItem = await InventoryModel.findOneAndUpdate(
            filter,
            { $inc: { currentStock: delta } },
            { new: true }
        );

        if (!updatedItem) {
            // Either the item doesn't exist/is archived, or (for a
            // deduction) the guard failed because current stock is lower
            // than requested — re-fetch to tell the two cases apart for a
            // clear error message.
            const existing = await InventoryModel.findById(itemId);
            if (!existing || existing.isArchived) {
                return res.status(404).json({ error: "Item not found" });
            }
            return res.status(400).json({
                error: `Cannot deduct ${quantityChanged} ${existing.measurementUnit} — only ${existing.currentStock} ${existing.measurementUnit} in stock.`
            });
        }

        const newStock = updatedItem.currentStock;
        const previousStock = newStock - delta;

        // Audit log — every stock change is tracked (the client's core ask).
        // Feature: `notes` is now populated from the Stock Update modal's
        // optional Reason field, instead of always being the default ''.
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

// Feature: soft-delete/archive instead of a permanent delete. The item
// stays in the database (so historical logs remain fully joinable, and an
// accidental delete can be undone with restoreItem below) but is excluded
// from the normal inventory views. The route/method (DELETE /inventory/:id)
// is unchanged, only the underlying behavior.
const deleteItem = async (req, res) => {
    try {
        const itemId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(404).json({ error: "Item not found" });
        }

        const archivedItem = await InventoryModel.findOneAndUpdate(
            { _id: itemId, isArchived: { $ne: true } },
            { isArchived: true },
            { new: true }
        );

        if (!archivedItem) {
            const existing = await InventoryModel.findById(itemId);
            if (!existing) {
                return res.status(404).json({ error: "Item not found" });
            }
            return res.status(409).json({ error: "This item is already archived." });
        }

        // Audit log — item archived (EC41: must capture item name, action,
        // admin account, IP, and time — all captured here)
        await createLog({
            req,
            logType: 'inventory',
            actionType: 'delete-item',
            itemId: archivedItem._id.toString(),
            itemName: archivedItem.itemName,
            previousStock: archivedItem.currentStock,
            newStock: archivedItem.currentStock,
            measurementUnit: archivedItem.measurementUnit,
            notes: 'Item archived'
        });

        return res.status(200).json({
            message: "Item archived successfully",
            item: archivedItem
        });
    } catch (error) {
        console.error("Error archiving item:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// Feature: bring an archived item back into the active inventory.
const restoreItem = async (req, res) => {
    try {
        const itemId = req.params.id;

        if (!mongoose.Types.ObjectId.isValid(itemId)) {
            return res.status(404).json({ error: "Item not found" });
        }

        const restoredItem = await InventoryModel.findOneAndUpdate(
            { _id: itemId, isArchived: true },
            { isArchived: false },
            { new: true }
        );

        if (!restoredItem) {
            const existing = await InventoryModel.findById(itemId);
            if (!existing) {
                return res.status(404).json({ error: "Item not found" });
            }
            return res.status(409).json({ error: "This item isn't archived." });
        }

        // Restoring under a name that now collides with an active item
        // would break the uniqueness rule createItem/updateItem enforce —
        // roll back rather than leaving two active items with the same name.
        const duplicate = await InventoryModel.findOne({
            _id: { $ne: itemId },
            itemName: { $regex: `^${escapeRegex(restoredItem.itemName.trim())}$`, $options: 'i' },
            isArchived: { $ne: true }
        });
        if (duplicate) {
            await InventoryModel.findByIdAndUpdate(itemId, { isArchived: true });
            return res.status(409).json({ error: "An active item with this name already exists. Rename or remove that item first." });
        }

        // Audit log — item restored from archive
        await createLog({
            req,
            logType: 'inventory',
            actionType: 'restore-item',
            itemId: restoredItem._id.toString(),
            itemName: restoredItem.itemName,
            previousStock: restoredItem.currentStock,
            newStock: restoredItem.currentStock,
            measurementUnit: restoredItem.measurementUnit,
            notes: 'Item restored from archive'
        });

        return res.status(200).json({
            message: "Item restored successfully",
            item: restoredItem
        });
    } catch (error) {
        console.error("Error restoring item:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

module.exports = {
    createItem,
    getItems,
    searchItems,
    updateItem,
    updateStock,
    deleteItem,
    restoreItem
};
