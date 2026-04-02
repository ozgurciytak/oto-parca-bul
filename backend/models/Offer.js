const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'Request', required: true },
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  price: { type: Number, required: true },
  partCondition: { type: String, enum: ['ORIJINAL_SIFIR', 'YAN_SANAYI_SIFIR', 'CIKMA'], required: true },
  description: { type: String },
  status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' }
}, { timestamps: true });

module.exports = mongoose.model('Offer', OfferSchema);
