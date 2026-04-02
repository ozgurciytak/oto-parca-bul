const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { 
      email, password, phone, name, tcNo, vkn, companyName,
      city, district, neighborhood, address, role, specializedBrands, sellingTypes 
    } = req.body;
    
    if (!email || !password || !phone || !name) {
      return res.status(400).json({ error: 'E-posta, şifre, telefon ve isim alanları zorunludur.' });
    }

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ error: 'Bu e-posta adresi zaten kullanımda.' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ 
      email, password: hashedPassword, phone, name, tcNo, vkn, companyName,
      city, district, neighborhood, address, role,
      specializedBrands: specializedBrands || [],
      sellingTypes: sellingTypes || []
    });
    
    if (role === 'DEALER') {
      user.isSubscriptionActive = true;
      const today = new Date();
      user.subscriptionEndDate = today.setMonth(today.getMonth() + 1);
    }

    await user.save();
    res.status(201).json({ message: 'Kayıt başarılı!', user: { _id: user._id, name: user.name, role: user.role, email: user.email, specializedBrands: user.specializedBrands, sellingTypes: user.sellingTypes } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Kullanıcı veya şifre hatalı.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Hatalı şifre.' });

    if (user.isActive === false) return res.status(403).json({ error: 'Hesabınız yönetici tarafından askıya alınmıştır. Lütfen iletişime geçin.' });
    
    // Login olduktan sonra kullanıcının tüm detaylarını döndür (Örn: bakiye, IBAN vs.)
    const userObj = user.toObject();
    delete userObj.password;

    res.json({ message: 'Giriş başarılı!', user: userObj });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'Sistemde böyle bir e-posta adresi bulunamadı.' });

    const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(tempPassword, salt);
    await user.save();

    res.json({ message: `Şifreniz sıfırlandı. Yeni geçici şifreniz: ${tempPassword}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profile/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    res.json({ data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile/:id', async (req, res) => {
  try {
    const { phone, name, tcNo, address, password, specializedBrands, sellingTypes, companyName, vkn, bankAccount } = req.body;
    let user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (tcNo) user.tcNo = tcNo;
    if (address) user.address = address;
    if (companyName) user.companyName = companyName;
    if (vkn) user.vkn = vkn;
    if (bankAccount) user.bankAccount = bankAccount;
    
    if (specializedBrands) user.specializedBrands = specializedBrands;
    if (sellingTypes) user.sellingTypes = sellingTypes;

    if (password) {
       const salt = await bcrypt.genSalt(10);
       user.password = await bcrypt.hash(password, salt);
    }

    await user.save();
    res.json({ message: 'Profil başarıyla güncellendi.', data: user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
