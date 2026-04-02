/**
 * LocalBackend.js
 * Backend sunucusunun TAMAMEN yerini alan, uygulama içinde çalışan sistem.
 * Hiçbir internet bağlantısı gerektirmez. Tüm veriler bellekte tutulur.
 */

let DB = {
  users: [],
  requests: [],
  inventory: [],
  orders: [],
  complaints: [],
  messages: [],
  configs: [],
  payments: [],
};

let _idCounter = 1000;
const genId = () => String(++_idCounter);
const now = () => new Date().toISOString();

// ─── Basit şifre hash (bcrypt yerine) ───
const simpleHash = (pw) => 'hashed_' + pw;
const checkHash = (pw, hash) => hash === 'hashed_' + pw;

// ─── SEED DATA (Ahmet, Mert, Admin) ───
const seedDatabase = () => {
  const hashedPw = simpleHash('123');

  DB.users = [
    {
      _id: genId(), name: 'Genel Yönetici', email: 'admin@otoparca.com',
      password: hashedPw, phone: '05554443322', role: 'ADMIN',
      status: 'ACTIVE', isActive: true, createdAt: now(),
    },
    {
      _id: genId(), name: 'Ahmet Müşteri', email: 'ahmet@gmail.com',
      password: hashedPw, phone: '05301112233', tcNo: '12345678901',
      city: 'İstanbul', district: 'Kadıköy', address: 'Kadıköy Sahil Yolu No:5',
      role: 'CUSTOMER', isActive: true, createdAt: now(),
    },
    {
      _id: genId(), name: 'Mert Oto Yedek Parça', email: 'mertoto@gmail.com',
      password: hashedPw, phone: '05401112233', vkn: '9998887771',
      city: 'Ankara', district: 'Ostim', address: 'Ostim Sanayi Sitesi 12. Cadde',
      role: 'DEALER', isActive: true, isSubscriptionActive: true,
      walletBalance: 2500, specializedBrands: ['Renault', 'Fiat'],
      sellingTypes: ['CIKMA'], createdAt: now(),
    },
    {
      _id: genId(), name: 'Admin Yardımcısı', email: 'mod@otoparca.com',
      password: hashedPw, phone: '05001112233', role: 'ADMIN',
      isActive: true, createdAt: now(),
    },
  ];

  const dealer = DB.users.find(u => u.role === 'DEALER');
  const customer = DB.users.find(u => u.role === 'CUSTOMER');

  const invId = genId();
  DB.inventory = [
    {
      _id: invId, dealerId: dealer._id, brand: 'Renault', model: 'Clio',
      year: '2015', partName: 'Sol Ön Çamurluk', price: 1500,
      condition: 'CIKMA', createdAt: now(),
    },
  ];

  DB.orders = [
    {
      _id: genId(), customerId: customer._id, dealerId: dealer._id,
      inventoryId: invId, partName: 'Renault Clio Çamurluk',
      amount: 1500, status: 'PAID', createdAt: now(),
    },
  ];

  DB.configs = [
    { _id: genId(), key: 'MONTHLY_FEE', value: '750 TL' },
    { _id: genId(), key: 'HAVALE_BILGILERI', value: 'AKBANK TR 0011 2233 4455 6677 8899 - Özgür LTD' },
  ];
};

seedDatabase();

// ─── İLETİŞİM BİLGİSİ FİLTRESİ ───
const blockCheck = (text) => {
  if (!text) return false;
  const patterns = [
    /[0-9]{10,11}/, /[0-9]{2}\s[0-9]{4}\s[0-9]{4}/,
    /[a-zA-Z0-9+_.-]+@[a-zA-Z0-9.-]+/, /ara beni/i, /whatsapp/i,
  ];
  return patterns.some(p => p.test(text));
};

// ═══════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════
export const authLogin = (email, password) => {
  const user = DB.users.find(u => u.email === email?.toLowerCase()?.trim());
  if (!user) return { ok: false, status: 404, data: { error: 'Kullanıcı veya şifre hatalı.' } };
  if (!checkHash(password, user.password)) return { ok: false, status: 400, data: { error: 'Hatalı şifre.' } };
  if (user.isActive === false) return { ok: false, status: 403, data: { error: 'Hesabınız yönetici tarafından askıya alınmıştır.' } };

  const userObj = { ...user };
  delete userObj.password;
  return { ok: true, status: 200, data: { message: 'Giriş başarılı!', user: userObj } };
};

export const authRegister = (body) => {
  const { email, password, phone, name, role } = body;
  if (!email || !password || !phone || !name) return { ok: false, status: 400, data: { error: 'Zorunlu alanlar eksik.' } };
  if (DB.users.find(u => u.email === email)) return { ok: false, status: 400, data: { error: 'Bu e-posta zaten kullanımda.' } };

  const newUser = {
    _id: genId(), ...body, password: simpleHash(password),
    isActive: true, createdAt: now(),
  };
  if (role === 'DEALER') {
    newUser.isSubscriptionActive = true;
    newUser.walletBalance = 0;
  }
  DB.users.push(newUser);

  const userObj = { ...newUser };
  delete userObj.password;
  return { ok: true, status: 201, data: { message: 'Kayıt başarılı!', user: userObj } };
};

export const authForgotPassword = (email) => {
  const user = DB.users.find(u => u.email === email);
  if (!user) return { ok: false, status: 404, data: { error: 'Böyle bir e-posta bulunamadı.' } };
  const tempPw = String(Math.floor(100000 + Math.random() * 900000));
  user.password = simpleHash(tempPw);
  return { ok: true, status: 200, data: { message: `Yeni geçici şifreniz: ${tempPw}` } };
};

export const getProfile = (id) => {
  const user = DB.users.find(u => u._id === id);
  if (!user) return { ok: false, status: 404, data: { error: 'Kullanıcı bulunamadı.' } };
  const userObj = { ...user };
  delete userObj.password;
  return { ok: true, status: 200, data: { data: userObj } };
};

export const updateProfile = (id, body) => {
  const user = DB.users.find(u => u._id === id);
  if (!user) return { ok: false, status: 404, data: { error: 'Kullanıcı bulunamadı.' } };
  Object.keys(body).forEach(k => { if (k !== 'password' && body[k] !== undefined) user[k] = body[k]; });
  if (body.password) user.password = simpleHash(body.password);
  return { ok: true, status: 200, data: { message: 'Profil güncellendi.', data: user } };
};

// ═══════════════════════════════════════
//  REQUESTS (Müşteri Talepleri)
// ═══════════════════════════════════════
export const createRequest = (body) => {
  const req = { _id: genId(), ...body, status: 'OPEN', offers: [], createdAt: now() };
  DB.requests.push(req);
  return { ok: true, status: 201, data: { message: 'Talep oluşturuldu', data: req } };
};

export const getOpenRequests = () => {
  const data = DB.requests.filter(r => r.status === 'OPEN').map(r => {
    const cust = DB.users.find(u => u._id === r.customerId);
    return { ...r, customerId: cust ? { _id: cust._id, name: cust.name } : r.customerId };
  });
  return { ok: true, status: 200, data: { data } };
};

export const getDealerFeed = (dealerId) => {
  const dealer = DB.users.find(u => u._id === dealerId);
  if (!dealer) return getOpenRequests();
  let reqs = DB.requests.filter(r => r.status === 'OPEN');
  if (dealer.specializedBrands?.length) {
    reqs = reqs.filter(r => dealer.specializedBrands.includes(r.brand));
  }
  if (dealer.sellingTypes?.length) {
    reqs = reqs.filter(r => [...dealer.sellingTypes, 'FARKETMEZ'].includes(r.conditionPreference));
  }
  const data = reqs.map(r => {
    const cust = DB.users.find(u => u._id === r.customerId);
    return { ...r, customerId: cust ? { _id: cust._id, name: cust.name } : r.customerId };
  });
  return { ok: true, status: 200, data: { data } };
};

export const getCustomerRequests = (customerId) => {
  const data = DB.requests.filter(r => r.customerId === customerId);
  return { ok: true, status: 200, data: { data } };
};

// ═══════════════════════════════════════
//  INVENTORY (Esnaf Envanter)
// ═══════════════════════════════════════
export const addInventory = (body) => {
  const item = { _id: genId(), ...body, createdAt: now() };
  DB.inventory.push(item);
  return { ok: true, status: 201, data: { message: 'Parça eklendi.', data: item } };
};

export const getDealerInventory = (dealerId) => {
  const data = DB.inventory.filter(i => i.dealerId === dealerId);
  return { ok: true, status: 200, data: { data } };
};

export const searchInventory = (query) => {
  let items = [...DB.inventory];
  if (query.brand) items = items.filter(i => i.brand?.toLowerCase().includes(query.brand.toLowerCase()));
  if (query.model) items = items.filter(i => i.model?.toLowerCase().includes(query.model.toLowerCase()));
  if (query.year) items = items.filter(i => i.year === query.year);
  if (query.partName) items = items.filter(i => i.partName?.toLowerCase().includes(query.partName.toLowerCase()));

  const data = items.map(i => {
    const dealer = DB.users.find(u => u._id === i.dealerId);
    return { ...i, dealerId: dealer ? { _id: dealer._id, name: dealer.name, phone: dealer.phone, city: dealer.city, rating: dealer.rating, reviewCount: dealer.reviewCount } : i.dealerId };
  });
  return { ok: true, status: 200, data: { data } };
};

export const deleteInventory = (id) => {
  DB.inventory = DB.inventory.filter(i => i._id !== id);
  return { ok: true, status: 200, data: { message: 'Parça kaldırıldı.' } };
};

// ═══════════════════════════════════════
//  ORDERS (Sipariş & Güvenli Havuz)
// ═══════════════════════════════════════
export const createOrder = (body) => {
  const order = { _id: genId(), ...body, status: 'PAID', createdAt: now() };
  DB.orders.push(order);
  return { ok: true, status: 201, data: { message: 'Ödeme havuz hesabına alındı.', order } };
};

export const getUserOrders = (userId) => {
  const orders = DB.orders.filter(o => o.customerId === userId || o.dealerId === userId).map(o => {
    const cust = DB.users.find(u => u._id === o.customerId);
    const deal = DB.users.find(u => u._id === o.dealerId);
    return { ...o, customerId: cust || o.customerId, dealerId: deal || o.dealerId };
  });
  return { ok: true, status: 200, data: orders };
};

export const getAllOrders = () => {
  const orders = DB.orders.map(o => {
    const cust = DB.users.find(u => u._id === o.customerId);
    const deal = DB.users.find(u => u._id === o.dealerId);
    return { ...o, customerId: cust || o.customerId, dealerId: deal || o.dealerId };
  });
  return { ok: true, status: 200, data: orders };
};

export const cancelOrder = (id) => {
  const order = DB.orders.find(o => o._id === id);
  if (!order) return { ok: false, status: 404, data: { error: 'Sipariş bulunamadı.' } };
  if (order.status !== 'PAID') return { ok: false, status: 400, data: { error: 'Kargo sürecindeki sipariş iptal edilemez.' } };
  order.status = 'CANCELLED';
  return { ok: true, status: 200, data: { message: 'İptal edildi.', order } };
};

export const shipOrder = (id, body) => {
  const order = DB.orders.find(o => o._id === id);
  if (!order) return { ok: false, status: 404, data: { error: 'Sipariş bulunamadı.' } };
  order.status = 'SHIPPED';
  order.cargoCompany = body.cargoCompany;
  order.trackingCode = body.trackingCode;
  return { ok: true, status: 200, data: { message: 'Kargoya verildi.', order } };
};

export const completeOrder = (id) => {
  const order = DB.orders.find(o => o._id === id);
  if (!order) return { ok: false, status: 404, data: { error: 'Sipariş bulunamadı.' } };
  order.status = 'COMPLETED';
  order.payoutProcessed = true;
  const dealer = DB.users.find(u => u._id === order.dealerId);
  if (dealer) dealer.walletBalance = (dealer.walletBalance || 0) + order.amount;
  return { ok: true, status: 200, data: { message: 'Onaylandı, ödeme aktarıldı.', order } };
};

export const disputeOrder = (id, body) => {
  const order = DB.orders.find(o => o._id === id);
  if (!order) return { ok: false, status: 404, data: { error: 'Sipariş bulunamadı.' } };
  order.status = 'DISPUTE';
  order.disputeReason = body.disputeReason;
  order.faultStatus = 'PENDING_ADMIN';
  return { ok: true, status: 200, data: { message: 'İade talebi alındı.', order } };
};

export const resolveDispute = (id, body) => {
  const order = DB.orders.find(o => o._id === id);
  if (!order) return { ok: false, status: 404, data: { error: 'Sipariş bulunamadı.' } };
  order.faultStatus = body.faultStatus;
  if (body.faultStatus === 'DEALER_FAULT') {
    const dealer = DB.users.find(u => u._id === order.dealerId);
    if (dealer) dealer.walletBalance = (dealer.walletBalance || 0) - (body.cargoDeduction || 0);
    order.status = 'REFUNDED';
  } else if (body.faultStatus === 'CUSTOMER_FAULT') {
    order.status = 'REFUNDED';
  }
  return { ok: true, status: 200, data: { message: 'Anlaşmazlık çözüldü.', order } };
};

// ═══════════════════════════════════════
//  COMPLAINTS (Şikayet & Destek)
// ═══════════════════════════════════════
export const createComplaint = (body) => {
  const c = { _id: genId(), ...body, status: 'OPEN', createdAt: now() };
  DB.complaints.push(c);
  return { ok: true, status: 201, data: c };
};

export const getUserComplaints = (userId) => {
  const data = DB.complaints.filter(c => c.userId === userId);
  return { ok: true, status: 200, data };
};

export const getAllComplaints = () => {
  const data = DB.complaints.map(c => {
    const user = DB.users.find(u => u._id === c.userId);
    return { ...c, userId: user ? { _id: user._id, name: user.name, email: user.email, role: user.role } : c.userId };
  });
  return { ok: true, status: 200, data };
};

export const replyComplaint = (id, body) => {
  const c = DB.complaints.find(x => x._id === id);
  if (!c) return { ok: false, status: 404, data: { error: 'Bulunamadı.' } };
  c.adminReply = body.adminReply;
  c.status = body.status || 'CLOSED';
  return { ok: true, status: 200, data: c };
};

// ═══════════════════════════════════════
//  MESSAGES (Mesajlaşma)
// ═══════════════════════════════════════
export const getMessages = (u1, u2) => {
  const data = DB.messages.filter(m =>
    (m.from === u1 && m.to === u2) || (m.from === u2 && m.to === u1)
  ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  return { ok: true, status: 200, data };
};

export const sendMessage = (body) => {
  const { from, to, content } = body;
  if (blockCheck(content)) {
    const user = DB.users.find(u => u._id === from);
    if (user) user.status = 'SUSPENDED';
    return { ok: false, status: 403, data: { error: 'BLOKE', message: 'İletişim bilgisi yasaktır. Hesabınız donduruldu.' } };
  }
  const msg = { _id: genId(), from, to, content, createdAt: now() };
  DB.messages.push(msg);
  return { ok: true, status: 200, data: { success: true, message: 'Mesaj iletildi.', data: msg } };
};

// ═══════════════════════════════════════
//  ADMIN
// ═══════════════════════════════════════
export const adminGetUsers = () => {
  const data = DB.users.map(u => { const o = { ...u }; delete o.password; return o; });
  return { ok: true, status: 200, data };
};

export const adminToggleUser = (id) => {
  const user = DB.users.find(u => u._id === id);
  if (!user) return { ok: false, status: 404, data: { error: 'Üye bulunamadı.' } };
  user.isActive = !user.isActive;
  return { ok: true, status: 200, data: user };
};

export const adminGetConfigs = () => {
  return { ok: true, status: 200, data: DB.configs };
};

export const adminSetConfig = (body) => {
  let c = DB.configs.find(x => x.key === body.key);
  if (c) { c.value = body.value; }
  else { c = { _id: genId(), ...body }; DB.configs.push(c); }
  return { ok: true, status: 200, data: c };
};

export const adminGetPayments = () => {
  return { ok: true, status: 200, data: DB.payments };
};

export const adminCreatePayment = (body) => {
  const p = { _id: genId(), ...body, createdAt: now() };
  DB.payments.push(p);
  return { ok: true, status: 201, data: { message: 'Başarılı', payment: p } };
};

export const adminApprovePayment = (id) => {
  const p = DB.payments.find(x => x._id === id);
  if (!p) return { ok: false, status: 404, data: { error: 'Ödeme bulunamadı.' } };
  p.status = 'PAID';
  if (p.type === 'SUBSCRIPTION') {
    const user = DB.users.find(u => u._id === p.dealerId);
    if (user) {
      user.isSubscriptionActive = true;
      const end = new Date();
      end.setDate(end.getDate() + 30);
      user.subscriptionEndDate = end.toISOString();
    }
  }
  return { ok: true, status: 200, data: { message: 'Ödeme onaylandı.', payment: p } };
};
