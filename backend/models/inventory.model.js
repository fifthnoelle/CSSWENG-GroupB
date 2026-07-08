const mongoose = require('mongoose');

const Inventory = new mongoose.Schema({
    itemName: { type: String, required: true },

    itemType: { type: String, required: true },

    measurementUnit: { type: String, required: true },

    startingStock: { type: Number, required: true },

    lowStockThreshold: { type: Number, required: true },

    currentStock: { type: Number, default: function() { return this.startingStock; } },

    createdBy: { type: String, required: true },

    createdAt: { type: Date, default: Date.now },

    // Feature: soft-delete/archive. "Delete Ingredient" now archives the
    // item instead of removing it from the database, so an accidental
    // delete can be undone and historical logs stay joined to a real
    // document instead of just a name snapshot. Archived items are
    // excluded from the normal inventory views by default.
    isArchived: { type: Boolean, default: false }

}, { versionKey: false });

const InventoryModel = mongoose.model('Inventory', Inventory);

module.exports = InventoryModel;
