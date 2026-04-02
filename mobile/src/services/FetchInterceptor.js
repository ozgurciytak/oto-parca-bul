/**
 * FetchInterceptor.js
 * 
 * Global fetch fonksiyonunu yakalar ve TÜM API isteklerini
 * LocalBackend.js'e yönlendirir. Hiçbir internet bağlantısı gerekmez.
 * Ekran dosyalarında HİÇBİR DEĞİŞİKLİK yapmaya gerek yoktur.
 */

import * as LB from './LocalBackend';

const originalFetch = global.fetch;

const respond = (result) => {
  return Promise.resolve({
    ok: result.ok,
    status: result.status,
    json: () => Promise.resolve(result.data),
    text: () => Promise.resolve(JSON.stringify(result.data)),
  });
};

const interceptedFetch = (url, options = {}) => {
  // Sadece API isteklerini yakala
  if (typeof url !== 'string' || !url.includes('/api/')) {
    return originalFetch(url, options);
  }

  const method = (options.method || 'GET').toUpperCase();
  let body = {};
  try { body = options.body ? JSON.parse(options.body) : {}; } catch (e) { body = {}; }

  // URL'den path'i çıkar
  const pathMatch = url.match(/\/api\/(.*)/);
  if (!pathMatch) return originalFetch(url, options);
  const path = '/' + pathMatch[1];

  console.log(`[LocalAPI] ${method} ${path}`);

  // ═══ AUTH ═══
  if (path === '/auth/login' && method === 'POST') {
    return respond(LB.authLogin(body.email, body.password));
  }
  if (path === '/auth/register' && method === 'POST') {
    return respond(LB.authRegister(body));
  }
  if (path === '/auth/forgot-password' && method === 'POST') {
    return respond(LB.authForgotPassword(body.email));
  }
  if (path.match(/^\/auth\/profile\/(.+)$/) && method === 'GET') {
    const id = path.match(/^\/auth\/profile\/(.+)$/)[1];
    return respond(LB.getProfile(id));
  }
  if (path.match(/^\/auth\/profile\/(.+)$/) && method === 'PUT') {
    const id = path.match(/^\/auth\/profile\/(.+)$/)[1];
    return respond(LB.updateProfile(id, body));
  }

  // ═══ REQUESTS ═══
  if (path === '/requests' && method === 'POST') {
    return respond(LB.createRequest(body));
  }
  if (path === '/requests' && method === 'GET') {
    return respond(LB.getOpenRequests());
  }
  if (path.match(/^\/requests\/feed\/(.+)$/) && method === 'GET') {
    const dealerId = path.match(/^\/requests\/feed\/(.+)$/)[1];
    return respond(LB.getDealerFeed(dealerId));
  }
  if (path.match(/^\/requests\/customer\/(.+)$/) && method === 'GET') {
    const customerId = path.match(/^\/requests\/customer\/(.+)$/)[1];
    return respond(LB.getCustomerRequests(customerId));
  }

  // ═══ INVENTORY ═══
  if (path === '/inventory' && method === 'POST') {
    return respond(LB.addInventory(body));
  }
  if (path.match(/^\/inventory\/dealer\/(.+)$/) && method === 'GET') {
    const dealerId = path.match(/^\/inventory\/dealer\/(.+)$/)[1];
    return respond(LB.getDealerInventory(dealerId));
  }
  if (path.startsWith('/inventory/search') && method === 'GET') {
    const urlObj = new URL(url, 'http://x');
    const query = Object.fromEntries(urlObj.searchParams.entries());
    return respond(LB.searchInventory(query));
  }
  if (path.match(/^\/inventory\/(.+)$/) && method === 'DELETE') {
    const id = path.match(/^\/inventory\/(.+)$/)[1];
    return respond(LB.deleteInventory(id));
  }

  // ═══ ORDERS ═══
  if (path === '/orders' && method === 'POST') {
    return respond(LB.createOrder(body));
  }
  if (path === '/orders/admin/all' && method === 'GET') {
    return respond(LB.getAllOrders());
  }
  if (path.match(/^\/orders\/(.+)\/cancel$/) && method === 'PUT') {
    const id = path.match(/^\/orders\/(.+)\/cancel$/)[1];
    return respond(LB.cancelOrder(id));
  }
  if (path.match(/^\/orders\/(.+)\/ship$/) && method === 'PUT') {
    const id = path.match(/^\/orders\/(.+)\/ship$/)[1];
    return respond(LB.shipOrder(id, body));
  }
  if (path.match(/^\/orders\/(.+)\/complete$/) && method === 'PUT') {
    const id = path.match(/^\/orders\/(.+)\/complete$/)[1];
    return respond(LB.completeOrder(id));
  }
  if (path.match(/^\/orders\/(.+)\/dispute$/) && method === 'POST') {
    const id = path.match(/^\/orders\/(.+)\/dispute$/)[1];
    return respond(LB.disputeOrder(id, body));
  }
  if (path.match(/^\/orders\/(.+)\/resolve-dispute$/) && method === 'PUT') {
    const id = path.match(/^\/orders\/(.+)\/resolve-dispute$/)[1];
    return respond(LB.resolveDispute(id, body));
  }
  if (path.match(/^\/orders\/(.+)$/) && method === 'GET') {
    const userId = path.match(/^\/orders\/(.+)$/)[1];
    return respond(LB.getUserOrders(userId));
  }

  // ═══ COMPLAINTS ═══
  if (path === '/complaints' && method === 'POST') {
    return respond(LB.createComplaint(body));
  }
  if (path === '/complaints/admin/all' && method === 'GET') {
    return respond(LB.getAllComplaints());
  }
  if (path.match(/^\/complaints\/user\/(.+)$/) && method === 'GET') {
    const userId = path.match(/^\/complaints\/user\/(.+)$/)[1];
    return respond(LB.getUserComplaints(userId));
  }
  if (path.match(/^\/complaints\/admin\/(.+)\/reply$/) && method === 'PUT') {
    const id = path.match(/^\/complaints\/admin\/(.+)\/reply$/)[1];
    return respond(LB.replyComplaint(id, body));
  }

  // ═══ MESSAGES ═══
  if (path === '/messages/send' && method === 'POST') {
    return respond(LB.sendMessage(body));
  }
  if (path.match(/^\/messages\/([^/]+)\/([^/]+)$/) && method === 'GET') {
    const m = path.match(/^\/messages\/([^/]+)\/([^/]+)$/);
    return respond(LB.getMessages(m[1], m[2]));
  }

  // ═══ ADMIN ═══
  if (path === '/admin/users' && method === 'GET') {
    return respond(LB.adminGetUsers());
  }
  if (path.match(/^\/admin\/users\/(.+)\/toggle-status$/) && method === 'POST') {
    const id = path.match(/^\/admin\/users\/(.+)\/toggle-status$/)[1];
    return respond(LB.adminToggleUser(id));
  }
  if (path === '/admin/configs' && method === 'GET') {
    return respond(LB.adminGetConfigs());
  }
  if (path === '/admin/configs' && method === 'POST') {
    return respond(LB.adminSetConfig(body));
  }
  if (path === '/admin/payments' && method === 'GET') {
    return respond(LB.adminGetPayments());
  }
  if (path === '/admin/payments' && method === 'POST') {
    return respond(LB.adminCreatePayment(body));
  }
  if (path.match(/^\/admin\/payments\/(.+)\/approve$/) && method === 'POST') {
    const id = path.match(/^\/admin\/payments\/(.+)\/approve$/)[1];
    return respond(LB.adminApprovePayment(id));
  }

  // ═══ Eşleşmeyen → Boş 404 ═══
  console.warn(`[LocalAPI] Eşleşmeyen endpoint: ${method} ${path}`);
  return respond({ ok: false, status: 404, data: { error: 'Endpoint bulunamadı.' } });
};

// Global fetch'i değiştir
export const installInterceptor = () => {
  global.fetch = interceptedFetch;
  console.log('✅ [LocalAPI] Fetch interceptor kuruldu. Tüm istekler lokalde işleniyor.');
};
