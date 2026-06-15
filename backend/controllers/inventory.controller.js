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

// NEW GET ITEMS API
const getItems = async (req, res) => {
    try {
        // Fetches all inventory items from the database
        const items = await InventoryModel.find();
        return res.status(200).json(items);
    } catch (error) {
        console.error("Error fetching items:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// NEW SEARCH ITEMS API
const searchItems = async (req, res) => {
    try {
        const { query } = req.query; // Extracts ?query=... from the URL

        if (!query) {
            return res.status(400).json({ error: "Search query is required" });
        }

        // Search the database using a case-insensitive regular expression on itemName
        const items = await InventoryModel.find({
            itemName: { $regex: query, $options: 'i' }
        });

        return res.status(200).json(items);
    } catch (error) {
        console.error("Error searching items:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};

// NEW EDIT ITEM DETAILS API
const updateItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const updateData = req.body;

        // findByIdAndUpdate takes the ID, the new data, and an options object
        // { new: true } ensures it returns the updated document, not the old one
        const updatedItem = await InventoryModel.findByIdAndUpdate(
            itemId,
            updateData,
            { new: true, runValidators: true } 
        );

        if (!updatedItem) {
            return res.status(404).json({ error: "Item not found" });
        }

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

deleteItem = async (req, res) => {
    try {
        const itemId = req.params.id;
        const deletedItem = await InventoryModel.findByIdAndDelete(itemId);

        if (!deletedItem) {
            return res.status(404).json({ error: "Item not found" });
        }

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