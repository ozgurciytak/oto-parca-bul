const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: String, required: true }, // Eklendi: Araç yılı
  partName: { type: String, required: true },
  condition: { type: String, enum: ['CIKMA', 'SIFIR_ORIJINAL', 'SIFIR_YAN_SANAYI'], required: true },
  price: { type: Number, required: true },
  description: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Inventory', InventorySchema);
