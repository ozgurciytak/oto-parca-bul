const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Inventory = require('./models/Inventory');

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/otoparca';

const seedData = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('MongoDB bağlandı. Test verileri işleniyor...');

        // Karmaşayı önlemek için eski test verilerini temizliyoruz
        await User.deleteMany({});
        await Inventory.deleteMany({});

        const hashedPassword = await bcrypt.hash('123456', 10);

        // 1. ADMİN
        const admin = new User({
            name: 'Sistem Yöneticisi',
            email: 'admin@otoparca.com',
            password: hashedPassword,
            phone: '05550000000',
            city: 'İstanbul',
            role: 'ADMIN' // Gelecekteki web paneli için admin rolü
        });
        await admin.save();

        // 2. MÜŞTERİ
        const customer1 = new User({
            name: 'Ahmet Yılmaz',
            email: 'ahmet@gmail.com',
            password: hashedPassword,
            phone: '05321112233',
            city: 'İstanbul',
            address: '[İstanbul - Kadıköy / Bostancı] Lale Sokak No: 12',
            tcNo: '11111111111',
            role: 'CUSTOMER'
        });
        await customer1.save();

        // 3. ESNAFLAR (SATICILAR)
        const dealer1 = new User({
            name: 'Mert Oto Çıkma (Esnaf)',
            email: 'mertoto@gmail.com',
            password: hashedPassword,
            phone: '05554445566',
            city: 'İstanbul',
            address: '[İstanbul - Şişli / Mecidiyeköy] Sanayi Sitesi A Blok',
            tcNo: '12345678901',
            role: 'DEALER',
            specializedBrands: ['Ford', 'Volkswagen', 'Renault'],
            sellingTypes: ['CIKMA'],
            isSubscriptionActive: true, 
            rating: 4.8,
            reviewCount: 24
        });
        await dealer1.save();

        const dealer2 = new User({
            name: 'Yıldızlar Sıfır Parça',
            email: 'yildizlar@gmail.com',
            password: hashedPassword,
            phone: '05443332211',
            city: 'Ankara',
            address: '[Ankara - Keçiören / Etlik] 1. Sanayi Sitesi',
            tcNo: '1098765432',
            role: 'DEALER',
            specializedBrands: ['Audi', 'BMW', 'Mercedes'],
            sellingTypes: ['SIFIR_ORIJINAL', 'SIFIR_YAN_SANAYI'],
            isSubscriptionActive: true,
            rating: 4.9,
            reviewCount: 56
        });
        await dealer2.save();

        // 4. ESNAFLAR İÇİN HAZIR İLAN/ENVANTER
        const inv1 = new Inventory({
            dealerId: dealer1._id,
            brand: 'Volkswagen',
            model: 'Golf',
            partName: 'Sol Arka Stop Lambası',
            condition: 'CIKMA',
            price: 1500,
            description: 'Orijinal çıkma, hatasız.'
        });
        await inv1.save();

        const inv2 = new Inventory({
            dealerId: dealer2._id,
            brand: 'BMW',
            model: '320i',
            partName: 'Ön Tampon',
            condition: 'SIFIR_YAN_SANAYI',
            price: 4500,
            description: 'A kalite tayvan malı.'
        });
        await inv2.save();

        console.log('--- TEST HESAPLARI BAŞARIYLA OLUŞTURULDU ---');
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedData();
