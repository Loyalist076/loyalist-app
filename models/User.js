const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isAdminApproved: {
    type: Boolean,
    default: function () {
      return this.role !== 'admin'; // Auto-approve normal users
    }
  }
});

module.exports = mongoose.model('User', userSchema);
