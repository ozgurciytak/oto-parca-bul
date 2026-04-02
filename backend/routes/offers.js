const express = require('express');
const Offer = require('../models/Offer');
const Request = require('../models/Request');
const User = require('../models/User');
const router = express.Router();

// Esnafın parça talebine teklif vermesi
router.post('/', async (req, res) => {
  try {
    const { requestId, dealerId, price, partCondition, description } = req.body;

    // Abonelik kontrolü (Sadece aboneliği aktif parçacılar işlem yapabilir)
    const dealer = await User.findById(dealerId);
    if (!dealer || dealer.role !== 'DEALER') {
      return res.status(403).json({ error: 'Sadece esnaf kayıtlı kullanıcılar teklif verebilir.' });
    }
    
    if (!dealer.isSubscriptionActive) {
       return res.status(403).json({ error: 'Aboneliğiniz aktif değil. Teklif vermek için yenileyin.' });
    }

    const offer = new Offer({
      requestId, dealerId, price, partCondition, description
    });

    await offer.save();
    res.status(201).json({ message: 'Teklif başarıyla iletildi.', data: offer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Müşterinin kendi talebine gelen teklifleri görmesi
router.get('/request/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    
    // Gelen teklife parçacının isim ve telefon detaylarını dahil edelim
    const offers = await Offer.find({ requestId })
      .populate('dealerId', 'name phone isSubscriptionActive')
      .sort({ price: 1 }); // En ucuz teklif üstte

    res.json({ data: offers });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
