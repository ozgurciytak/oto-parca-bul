const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Message = require('../models/Message');

// AKILLI FİLTRE (POLİS)
const blockCheck = (text) => {
    const patterns = [
        /[0-9]{10,11}/, /[0-9]{2}\s[0-9]{4}\s[0-9]{4}/, 
        /[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+/, /ara beni/i, /whatsapp/i
    ];
    return patterns.some(p => p.test(text));
};

// 1. İki kullanıcı arasındaki mesaj geçmişini getir (WhatsApp Akışı)
router.get('/:u1/:u2', async (req, res) => {
    try {
        const { u1, u2 } = req.params;
        const history = await Message.find({
            $or: [
                { from: u1, to: u2 },
                { from: u2, to: u1 }
            ]
        }).sort({ createdAt: 1 });
        res.json(history);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Mesaj Gönder ve Kaydet
router.post('/send', async (req, res) => {
    try {
        const { from, to, content } = req.body;
        console.log(`📩 [YENİ MESAJ] ${from} -> ${to}`);

        // KONTROL
        if (blockCheck(content)) {
            console.log(`🚫 [ENGELLENDİ] Kural ihlali: ${from}`);
            await User.findByIdAndUpdate(from, { status: 'SUSPENDED' });
            return res.status(403).json({ error: 'BLOKE', message: 'İletişim bilgisi yasaktır. Hesabınız donduruldu.' });
        }

        const msg = new Message({ from, to, content });
        await msg.save();

        res.json({ success: true, message: 'Mesaj iletildi.', data: msg });
    } catch (error) {
        res.status(500).json({ error: 'SUNUCU HATASI', message: error.message });
    }
});

module.exports = router;
