const mongoose = require('mongoose');

const Inventory = new mongoose.Schema({
    itemName: { type: String, required: true },

    itemType: { type: String, required: true },

    measurementUnit: { type: String, required: true },

    startingStock: { type: Number, required: true },

    lowStockThreshold: { type: Number, required: true },

    createdBy: { type: String, required: true },

    createdAt: { type: Date, default: Date.now }

}, { versionKey: false });

const InventoryModel = mongoose.model('Inventory', Inventory);

module.exports = InventoryModel;