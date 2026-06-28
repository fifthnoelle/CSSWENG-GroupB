const mongoose = require('mongoose');

const Users = new mongoose.Schema({
  email: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  password: { type: String },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  failedLoginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },

  // 2.1.9 — password history, checked on change so old passwords can't be reused
  passwordHistory: { type: [String], default: [] },
  // 2.1.10 — passwords must be at least 1 day old before they can be changed again
  passwordChangedAt: { type: Date, default: Date.now },

  // 2.1.11 — last login (successful and failed) reported to the user at next login
  lastLoginAt: { type: Date, default: null },
  lastLoginStatus: { type: String, enum: ['success', 'failed', null], default: null },
  lastLoginIp: { type: String, default: '' }
}, { versionKey: false });

const UsersModel = mongoose.model('Users', Users);

module.exports = UsersModel;
