const InventoryModel = require("../models/inventory.model");

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

const updateStock = async (req, res) => {
    const itemId = req.params.id;
    const updateData = req.params.currerntStock;
    try {        
        const updatedItem = await InventoryModel.findByIdAndUpdate(itemId, { currentStock: updateData }, { new: true });
        if (!updatedItem) {
            return res.status(404).json({ error: "Item not found" });
        }     return res.status(200).json({
            message: "Stock updated successfully",
            item: updatedItem
        });
    } catch (error) {
        console.error("Error updating stock:", error);
        return res.status(500).json({ error: "Error updating stock" });
    }

};

module.exports = {
    createItem,
    updateStock
};