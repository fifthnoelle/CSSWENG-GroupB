const mongoose = require('mongoose');

const Logs = new mongoose.Schema({
    userId: { type: String, required: true },          // who performed the action
    logType: { type: String, enum: ['inventory', 'accounts'], required: true },
    userName: { type: String, required: true },         // display name of the actor, captured at log time
    userTarget: { type: String, default: '' },          // id of the affected user/item (account logs use userId, inventory logs use itemId)
    userTargetName: { type: String, default: '' },      // display name of the affected user (accounts logs only)
    itemId: { type: String, default: '' },              // affected inventory item, if applicable
    itemName: { type: String, default: '' },            // snapshot of item name at log time (in case item gets renamed/deleted later)
    actionType: { type: String, required: true },       // e.g. 'used-today' | 'restock' | 'create-item' | 'edit-item' | 'delete-item' | 'create-user' | 'edit-user' | 'delete-user' | 'edit-role'
    quantityChanged: { type: Number, default: 0 },
    previousStock: { type: Number, default: 0 },
    newStock: { type: Number, default: 0 },
    measurementUnit: { type: String, default: '' },
    notes: { type: String, default: '' },                // free-text reason, e.g. "Sold", "Waste", "Restock"
    ipAddress: { type: String, default: '' },
    actionTime: { type: Date, default: Date.now }
}, { versionKey: false });

// Most log queries are "recent activity" or "activity for this item/user" — index accordingly
Logs.index({ actionTime: -1 });
Logs.index({ itemId: 1, actionTime: -1 });
Logs.index({ logType: 1, actionTime: -1 });

const LogsModel = mongoose.model('Logs', Logs);

module.exports = LogsModel;
