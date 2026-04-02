const express = require('express');
const Inventory = require('../models/Inventory');
const router = express.Router();

// Esnafın stoğa (kendi ilanlarına) parça eklemesi
router.post('/', async (req, res) => {
  try {
    const { dealerId, brand, model, year, partName, condition, price, description } = req.body;
    
    const item = new Inventory({
      dealerId, brand, model, year, partName, condition, price, description
    });
    await item.save();
    res.status(201).json({ message: 'Parça envantere başarıyla eklendi.', data: item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Esnafın kendi envanterini getirmesi
router.get('/dealer/:dealerId', async (req, res) => {
  try {
    const items = await Inventory.find({ dealerId: req.params.dealerId }).sort({ createdAt: -1 });
    res.json({ data: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Müşterinin marka/model/parça araması yapması
router.get('/search', async (req, res) => {
  try {
    const { brand, model, year, partName } = req.query;
    let filter = {};

    if (brand) filter.brand = new RegExp(brand, 'i');
    if (model) filter.model = new RegExp(model, 'i');
    if (year) filter.year = year; // Yıl tam eşleşmeli
    if (partName) filter.partName = new RegExp(partName, 'i');

    const items = await Inventory.find(filter)
       .populate('dealerId', 'name phone city rating reviewCount')
       .sort({ price: 1 }); // en ucuz parçalar üstte görünsün
       
    res.json({ data: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Envanterden parça silme
router.delete('/:id', async (req, res) => {
  try {
    await Inventory.findByIdAndDelete(req.params.id);
    res.json({ message: 'Parça sistemden kaldırıldı.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
