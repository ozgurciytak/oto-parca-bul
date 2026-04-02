const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String, required: true },
  name: { type: String, required: true },
  tcNo: { type: String }, // TC veya VKN
  city: { type: String },
  district: { type: String },
  neighborhood: { type: String },
  address: { type: String },
  role: { type: String, enum: ['CUSTOMER', 'DEALER', 'ADMIN'], default: 'CUSTOMER' },
  // Esnaflarlar için
  vkn: { type: String }, // Vergi Kimlik No (Esnaf için zorunlu)
  companyName: { type: String },
  specializedBrands: [{ type: String }],
  sellingTypes: [{ type: String, enum: ['CIKMA', 'SIFIR_ORIJINAL', 'SIFIR_YAN_SANAYI'] }], 
  bankAccount: { 
     bankName: String,
     iban: String,
     receiverName: String
  },
  rating: { type: Number, default: 5.0 }, // Esnaf Puanı Sistemi
  reviewCount: { type: Number, default: 0 },
  isSubscriptionActive: { type: Boolean, default: false },
  subscriptionEndDate: { type: Date },
  status: { type: String, enum: ['ACTIVE', 'SUSPENDED'], default: 'ACTIVE' },
  isActive: { type: Boolean, default: true }, // Admin tarafından engellenip engellenmediği
  // Cüzdan & Ödeme Anlaşması (Esnaflar için)
  walletBalance: { type: Number, default: 0 }, 
  payoutPlan: { type: String, enum: ['DAILY', 'WEEKLY', 'MONTHLY'], default: 'WEEKLY' } 
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
