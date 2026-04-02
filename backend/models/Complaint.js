const mongoose = require('mongoose');

const ComplaintSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' }, // İsteğe bağlı, bir siparişle ilgili olabilir
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['OPEN', 'PENDING', 'CLOSED'], default: 'OPEN' },
  adminReply: { type: String },
  role: { type: String, enum: ['CUSTOMER', 'DEALER'] } // Şikayeti kimin açtığı
}, { timestamps: true });

module.exports = mongoose.model('Complaint', ComplaintSchema);
