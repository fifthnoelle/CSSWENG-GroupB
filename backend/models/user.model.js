const mongoose = require('mongoose');

const Users = new mongoose.Schema({
  email: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  password: { type: String },
  role: { type: String, enum: ['admin', 'staff'], default: 'staff' },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

const UsersModel = mongoose.model('Users', Users);

module.exports = UsersModel;
