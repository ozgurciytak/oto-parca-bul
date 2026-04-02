const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');

// Admin: Tüm Şikayetleri Getir (Kullanıcı ismini de ekleyerek)
router.get('/admin/all', async (req, res) => {
  try {
    const complaints = await Complaint.find()
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcının Kendi Şikayetlerini Listele
router.get('/user/:userId', async (req, res) => {
  try {
    const complaints = await Complaint.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni Şikayet Oluştur
router.post('/', async (req, res) => {
  try {
    const { userId, subject, message, role } = req.body;
    const complaint = new Complaint({ userId, subject, message, role });
    await complaint.save();
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin: Şikayete Cevap Ver
router.put('/admin/:id/reply', async (req, res) => {
  try {
    const { adminReply, status } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, {
      adminReply, status: status || 'CLOSED'
    }, { new: true });
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
