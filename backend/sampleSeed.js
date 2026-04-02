const mongoose = require('mongoose');

// MODELLER (Hızlı mühürleme için şema tanımları)
const requestSchema = new mongoose.Schema({
    partName: String, description: String, vehicleBrand: String, vehicleModel: String,
    customerId: mongoose.Schema.Types.ObjectId, status: { type: String, default: 'OPEN' },
    createdAt: { type: Date, default: Date.now }
});
const Request = mongoose.models.Request || mongoose.model('Request', requestSchema);

async function seed() {
    await mongoose.connect('mongodb://localhost:27017/oto_parca_bul');
    
    // ÖRNEK MÜŞTERİ ID (Eğer yoksa rastgele bir ID)
    const mockCustomerId = new mongoose.Types.ObjectId();

    const sampleRequests = [
        {
            partName: 'BMW 3.20 Sol Led Far',
            description: '2019 model aracım için temiz çıkma veya sıfır parça arıyorum. Çatlak olmasın lütfen.',
            vehicleBrand: 'BMW',
            vehicleModel: '3.20i (F30)',
            customerId: mockCustomerId
        },
        {
            partName: 'Mercedes E200 Ön Amortisör Seti',
            description: 'Sachs veya Bilstein marka sıfır takım fiyatı bekliyorum. Acil lazım.',
            vehicleBrand: 'Mercedes',
            vehicleModel: 'E200 (W212)',
            customerId: mockCustomerId
        },
        {
            partName: 'Audi A4 Yağ Bakım Seti',
            description: 'Castrol Edge 5-30 Yağ + Yağ Filtresi + Hava Filtresi. 2017 model A4 TDI.',
            vehicleBrand: 'Audi',
            vehicleModel: 'A4 2.0 TDI',
            customerId: mockCustomerId
        }
    ];

    await Request.deleteMany({}); // Temizlik
    await Request.insertMany(sampleRequests);
    
    console.log('--- ÖRNEK İLANLAR MÜHÜRLENDİ ---');
    process.exit();
}

seed();
