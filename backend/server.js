const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');
const seedDb = require('./seedDb');

const app = express();
app.use(cors());
app.use(express.json());

// ROTALAR (Önce Mesajlaşma Kapısını Açıyoruz)
app.use('/api/messages', require('./routes/messages'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/complaints', require('./routes/complaints'));
app.use('/api/admin', require('./routes/admin'));

const startServer = async () => {
  try {
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB Memory Server Bağlandı!');

    // ÖNEMLİ: Bağlantı kurulur kurulmaz SEED (Ahmet ve Mert) Yükle
    await seedDb();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 API Dinleniyor: http://localhost:${PORT}`);
      console.log(`🌐 Uzak Erişim: http://192.168.1.166:${PORT}`);
    });
  } catch (error) {
    console.error('SERVER HATASI:', error);
  }
};

startServer();
