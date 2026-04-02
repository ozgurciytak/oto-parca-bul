const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User');

// ÖNEMLİ: Sabit rotalar (admin gibi) parametreli rotalardan (:userId) ÖNCE gelmelidir!

// ADMIN: Tüm Dispute ve İşlem Görenleri Listele
router.get('/admin/all', async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('customerId', 'name')
      .populate('dealerId', 'name')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Kullanıcının veya Esnafın Siparişlerini Çek
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ $or: [{ customerId: userId }, { dealerId: userId }] })
      .populate('customerId', 'name phone address')
      .populate('dealerId', 'name phone city format')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Yeni Sipariş Oluşturma (Havuz hesabına para giriş simülasyonu)
router.post('/', async (req, res) => {
  try {
    const { customerId, dealerId, inventoryId, offerId, partName, amount } = req.body;
    const newOrder = new Order({
      customerId, dealerId, inventoryId, offerId, partName, amount, status: 'PAID'
    });
    await newOrder.save();
    res.status(201).json({ message: 'Ödeme güvenli havuz hesabımıza alındı.', order: newOrder });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Sipariş İptali (Kargo Öncesi Her İki Taraf)
router.put('/:id/cancel', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı.' });
    if (order.status !== 'PAID') return res.status(400).json({ error: 'Kargo sürecindeki sipariş iptal edilemez.' });

    order.status = 'CANCELLED';
    await order.save();
    res.json({ message: 'Sipariş iptal edildi. Para iadesi süreci yönetime devredildi.', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Esnaf: Kargoya Ver
router.put('/:id/ship', async (req, res) => {
  try {
    const { cargoCompany, trackingCode } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, {
      status: 'SHIPPED', cargoCompany, trackingCode
    }, { new: true });
    res.json({ message: 'Sipariş kargoya verildi olarak işaretlendi.', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Müşteri: Kargo Sorunsuz Elime Ulaştı (Esnafa Parayı Aktar)
router.put('/:id/complete', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı.' });

    order.status = 'COMPLETED';
    order.payoutProcessed = true;

    // Esnafın bakiyesine tutarı ekle
    await User.findByIdAndUpdate(order.dealerId, { $inc: { walletBalance: order.amount } });
    
    await order.save();
    res.json({ message: 'Onaylandı, ödeme esnafın cari bakiyesine aktarıldı.', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Müşteri: İade / İptal Talebi Oluştur (Açık Anlaşmazlık)
router.post('/:id/dispute', async (req, res) => {
  try {
    const { disputeReason } = req.body;
    const order = await Order.findByIdAndUpdate(req.params.id, {
      status: 'DISPUTE', disputeReason, faultStatus: 'PENDING_ADMIN'
    }, { new: true });
    res.json({ message: 'İade talebi yönetici incelemesine alındı.', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ADMIN: Anlaşmazlığı (Dispute) Çöz ve Kargo Ücretini Kes
router.put('/:id/resolve-dispute', async (req, res) => {
  try {
    const { faultStatus, cargoDeduction } = req.body; 
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Sipariş bulunamadı.' });

    order.faultStatus = faultStatus;
    
    if (faultStatus === 'DEALER_FAULT') {
      await User.findByIdAndUpdate(order.dealerId, { $inc: { walletBalance: -cargoDeduction } });
      order.status = 'REFUNDED';
    } 
    else if (faultStatus === 'CUSTOMER_FAULT') {
      order.status = 'REFUNDED';
    }

    await order.save();
    res.json({ message: 'Anlaşmazlık admin kararıyla çözüldü.', order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
