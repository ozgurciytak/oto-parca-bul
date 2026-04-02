const mongoose = require('mongoose');

const RequestSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  partName: { type: String, required: true },
  description: { type: String },
  // Müşterinin spesifik olarak aradığı parça tipi (Çıkma mı Sıfır mı)
  conditionPreference: { type: String, enum: ['CIKMA', 'SIFIR_ORIJINAL', 'SIFIR_YAN_SANAYI', 'FARKETMEZ'], default: 'FARKETMEZ' },
  status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN' }
}, { timestamps: true });

module.exports = mongoose.model('Request', RequestSchema);
