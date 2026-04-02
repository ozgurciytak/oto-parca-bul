const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Config = require('../models/Config');
const Payment = require('../models/Payment');

// 1. Tüm kullanıcıları getir
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Ödemeleri/Bildirimleri Listeletme (Admin için)
router.get('/payments', async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Ödeme Bildirimi Oluşturma 🚀 (Mutlak Endpoint)
router.post('/payments', async (req, res) => {
  try {
    const { dealerId, dealerName, amount, type, status, cardLastFour, note } = req.body;
    console.log('✅ YENİ ÖDEME BİLDİRİMİ GELDİ:', dealerName, amount);
    
    if(!dealerId || !amount) return res.status(400).json({ error: 'Eksik parametre.' });

    const newPayment = new Payment({
      dealerId, dealerName, amount, type, status,
      paymentMethod: cardLastFour ? 'CARD' : 'EFT',
      cardLastFour, note
    });

    await newPayment.save();
    res.status(201).json({ message: 'Başarılı', payment: newPayment });
  } catch (error) {
    console.error('❌ ÖDEME KAYIT HATASI:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 4. Ödeme Onaylama (Admin için) ✅
router.post('/payments/:id/approve', async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);
        if(!payment) return res.status(404).json({ error: 'Ödeme bulunamadı.' });

        payment.status = 'PAID';
        await payment.save();

        if(payment.type === 'SUBSCRIPTION') {
            const user = await User.findById(payment.dealerId);
            if(user) {
                user.isSubscriptionActive = true;
                const now = new Date();
                // Eski tarihin üzerine mi ekleyelim yoksa bugünden itibaren mi başlatalım? (Mühürlü: Bugün + 30)
                const calculateDaysLeft = () => {
                    if(!user?.subscriptionEndDate) return 0;
                    const days = Math.ceil((new Date(user.subscriptionEndDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return days > 0 ? days : 0;
                };
                const baseDate = (user.subscriptionEndDate && user.subscriptionEndDate > now) ? user.subscriptionEndDate : now;
                const newEndDate = new Date(baseDate);
                newEndDate.setDate(newEndDate.getDate() + 30);
                
                user.subscriptionEndDate = newEndDate;
                await user.save();
                console.log(`✅ ${user.email} SÜRESİ UZATILDI:`, newEndDate);
            }
        }
        res.json({ message: 'Ödeme onaylandı ve üyelik mühürlendi.', payment });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. Sistem Konfigürasyonları
router.get('/configs', async (req, res) => {
  try {
    const configs = await Config.find();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/configs', async (req, res) => {
  try {
    const { key, value } = req.body;
    let config = await Config.findOne({ key });
    if(config) { config.value = value; await config.save(); }
    else { config = new Config({ key, value }); await config.save(); }
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users/:id/toggle-status', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if(!user) return res.status(404).json({ error: 'Üye bulunamadı.' });
        user.isActive = !user.isActive;
        await user.save();
        res.json(user);
    } catch(e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
