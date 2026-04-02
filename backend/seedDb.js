const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Inventory = require('./models/Inventory');
const Order = require('./models/Order');
const Complaint = require('./models/Complaint');
const Config = require('./models/Config');
const Request = require('./models/Request');

const seedData = async () => {
    try {
        // BAĞLANTIYI KONTROL ET
        if (mongoose.connection.readyState !== 1) {
            console.log('Veritabanı hazır değil, beklemede...');
            return;
        }

        await User.deleteMany({});
        await Inventory.deleteMany({});
        await Order.deleteMany({});
        await Complaint.deleteMany({});
        await Config.deleteMany({});
        await Request.deleteMany({});

        const salt = await bcrypt.genSalt(10);
        const hashedPw = await bcrypt.hash('123', salt);

        // 1. ADMIN - ROLÜNÜ BÜYÜK HARF SABİTLEDİM
        const admin = new User({
            name: 'Genel Yönetici',
            email: 'admin@otoparca.com',
            password: hashedPw,
            phone: '05554443322',
            role: 'ADMIN',
            status: 'ACTIVE',
            isActive: true
        });
        await admin.save();

        // 2. MÜŞTERİLER
        const customer1 = new User({
            name: 'Ahmet Müşteri',
            email: 'ahmet@gmail.com',
            password: hashedPw,
            phone: '05301112233',
            tcNo: '12345678901',
            city: 'İstanbul',
            district: 'Kadıköy',
            address: 'Kadıköy Sahil Yolu No:5',
            role: 'CUSTOMER',
            isActive: true
        });
        await customer1.save();

        // 3. ESNAFLAR
        const dealer1 = new User({
            name: 'Mert Oto Yedek Parça',
            email: 'mertoto@gmail.com',
            password: hashedPw,
            phone: '05401112233',
            vkn: '9998887771',
            city: 'Ankara',
            district: 'Ostim',
            address: 'Ostim Sanayi Sitesi 12. Cadde',
            role: 'DEALER',
            isActive: true,
            isSubscriptionActive: true,
            walletBalance: 2500,
            specializedBrands: ['Renault', 'Fiat'],
            sellingTypes: ['CIKMA']
        });
        await dealer1.save();

        // EKSTRA YÖNETİCİ (USER İSTEĞİ: Başka admin ekleme mantığı için)
        await new User({ name: 'Admin Yardımcısı', email: 'mod@otoparca.com', password: hashedPw, phone: '05001112233', role: 'ADMIN', isActive: true }).save();

        // ENVANTER & SİPARİŞ
        const inv1 = new Inventory({ dealerId: dealer1._id, brand: 'Renault', model: 'Clio', year: '2015', partName: 'Sol Ön Çamurluk', price: 1500, condition: 'CIKMA' });
        await inv1.save();
        
        await new Order({ customerId: customer1._id, dealerId: dealer1._id, inventoryId: inv1._id, partName: 'Renault Clio Çamurluk', amount: 1500, status: 'PAID' }).save();

        // SİSTEM AYARLARI
        await new Config({ key: 'MONTHLY_FEE', value: '750 TL' }).save();
        await new Config({ key: 'HAVALE_BILGILERI', value: 'AKBANK TR 0011 2233 4455 6677 8899 - Özgür LTD' }).save();

        const count = await User.countDocuments();
        console.log(`✅ VERİ TABANI HAZIR: ${count} ADET ÜYE (Ahmet ve Mert dahil) YÜKLENDİ.`);
    } catch (e) {
        console.error('SEED HATASI:', e);
    }
};

module.exports = seedData;
