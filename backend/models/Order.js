const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  dealerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  inventoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory' }, // Opsiyonel (Direkt alışverişte dolu)
  offerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' }, // Opsiyonel (Teklif tabanlı alışverişte dolu)
  
  partName: { type: String, required: true },
  amount: { type: Number, required: true }, // Havuz hesabımıza (Otoparca) yatırılan para
  status: { 
     type: String, 
     enum: ['PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED', 'DISPUTE', 'REFUNDED'], 
     default: 'PAID' 
  },
  
  cargoCompany: { type: String },
  trackingCode: { type: String },
  
  // İade / İptal (DISPUTE) Durumunda:
  disputeReason: { type: String },
  faultStatus: { type: String, enum: ['PENDING_ADMIN', 'DEALER_FAULT', 'CUSTOMER_FAULT', 'NO_FAULT'] },
  
  // Ödeme Aktarımı
  payoutProcessed: { type: Boolean, default: false } // Esnafa ödemesi yapıldı mı?
}, { timestamps: true });

module.exports = mongoose.model('Order', OrderSchema);
