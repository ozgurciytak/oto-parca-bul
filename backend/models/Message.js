const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  from: { type: String, required: true }, // Gönderen ID
  to: { type: String, required: true },   // Alıcı ID
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Message', MessageSchema);
