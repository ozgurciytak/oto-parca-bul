const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dealerName: { type: String },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['SUBSCRIPTION', 'COMMISSION', 'OTHER'], default: 'SUBSCRIPTION' },
  status: { type: String, enum: ['PENDING', 'PAID', 'REJECTED'], default: 'PENDING' },
  paymentMethod: { type: String, enum: ['EFT', 'CARD'], default: 'EFT' },
  cardLastFour: { type: String },
  note: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Payment', PaymentSchema);
