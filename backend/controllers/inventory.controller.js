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

module.exports = {
    createItem
};