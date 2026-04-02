const express = require('express');
const Request = require('../models/Request');
const User = require('../models/User'); // Ekstra yetki/durum için getirdik
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { customerId, brand, model, year, partName, description, conditionPreference } = req.body;
    
    const newRequest = new Request({
      customerId, brand, model, year, partName, description, conditionPreference
    });

    await newRequest.save();
    res.status(201).json({ message: 'Talep başarıyla oluşturuldu', data: newRequest });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eski geneller için feed (Yedek)
router.get('/', async (req, res) => {
  try {
    const requests = await Request.find({ status: 'OPEN' }).populate('customerId', 'name').sort({ createdAt: -1 });
    res.json({ data: requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// YENİ: Esnafa özel filtrelenmiş feed
router.get('/feed/:dealerId', async (req, res) => {
  try {
    const dealer = await User.findById(req.params.dealerId);
    if (!dealer || dealer.role !== 'DEALER') return res.status(403).json({ error: 'Yetkisiz erişim' });
    
    // Seçtiği Markalardan olsun, ya da esnaf tüm markalara bakıyorsa (dizi boşsa) hepsini getir.
    const filter = { status: 'OPEN' };
    
    if (dealer.specializedBrands && dealer.specializedBrands.length > 0) {
       filter.brand = { $in: dealer.specializedBrands };
    }

    // Seçtiği Türlere (Çıkma / Sıfır vs) uygun ilanları getir:
    if (dealer.sellingTypes && dealer.sellingTypes.length > 0) {
       // Müşterinin tercih ettiği ile uyuşanları ve "Farketmez"leri esnafa göster.
       // Örn: Satıcı "ÇIKMA" satıyorsa, müşteri de "ÇIKMA" veya "FARKETMEZ" demişse ona düşer.
       filter.conditionPreference = { $in: [...dealer.sellingTypes, 'FARKETMEZ'] };
    }

    const requests = await Request.find(filter)
      .populate('customerId', 'name')
      .sort({ createdAt: -1 });

    res.json({ data: requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Müşteriye özel
router.get('/customer/:customerId', async (req, res) => {
  try {
    const requests = await Request.find({ customerId: req.params.customerId }).sort({ createdAt: -1 });
    res.json({ data: requests });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
