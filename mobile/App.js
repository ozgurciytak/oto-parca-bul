import { installInterceptor } from './src/services/FetchInterceptor';
installInterceptor(); // Tüm fetch isteklerini yerel backend'e yönlendir

import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import AuthScreen from './src/screens/AuthScreen';
import RegisterCustomerScreen from './src/screens/RegisterCustomerScreen';
import RegisterDealerScreen from './src/screens/RegisterDealerScreen';
import CustomerDashboard from './src/screens/CustomerDashboard';
import NewRequestScreen from './src/screens/NewRequestScreen';
import DealerDashboard from './src/screens/DealerDashboard';
import ProfileScreen from './src/screens/ProfileScreen';
import OfferDetailsScreen from './src/screens/OfferDetailsScreen';
import DealerInventoryScreen from './src/screens/DealerInventoryScreen'; // Eklendi
import SearchPartsScreen from './src/screens/SearchPartsScreen'; // Müşteri Stok Arama
import AdminDashboard from './src/screens/AdminDashboard'; // Yönetici Paneli
import OrdersScreen from './src/screens/OrdersScreen'; // Güvenli Havuz & Sipariş
import SupportScreen from './src/screens/SupportScreen'; // Destek & Şikayet

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('AUTH'); 
  const [user, setUser] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
    if (loggedUser.role === 'ADMIN') setCurrentScreen('ADMIN_DASHBOARD');
    else if (loggedUser.role === 'CUSTOMER') setCurrentScreen('CUSTOMER_DASHBOARD');
    else setCurrentScreen('DEALER_DASHBOARD');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('AUTH');
  };

  const goProfile = () => setCurrentScreen('PROFILE');

  const goDash = () => {
    if (user?.role === 'ADMIN') setCurrentScreen('ADMIN_DASHBOARD');
    else if (user?.role === 'CUSTOMER') setCurrentScreen('CUSTOMER_DASHBOARD');
    else setCurrentScreen('DEALER_DASHBOARD');
  };

  const handleSelectRequest = (req) => {
    setSelectedRequest(req);
    setCurrentScreen('OFFER_DETAILS');
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case 'AUTH':
        return <AuthScreen 
                  onLogin={handleLogin} 
                  onNavCustomer={() => setCurrentScreen('REG_CUSTOMER')}
                  onNavDealer={() => setCurrentScreen('REG_DEALER')}
               />;
      case 'REG_CUSTOMER':
        return <RegisterCustomerScreen onBack={() => setCurrentScreen('AUTH')} onLogin={handleLogin} />;
      case 'REG_DEALER':
        return <RegisterDealerScreen onBack={() => setCurrentScreen('AUTH')} onLogin={handleLogin} />;
      case 'CUSTOMER_DASHBOARD':
        return <CustomerDashboard user={user} onLogout={handleLogout} onNewRequest={() => setCurrentScreen('NEW_REQUEST')} onSelectRequest={req => { setSelectedRequest(req); setCurrentScreen('OFFER_DETAILS'); }} onProfile={goProfile} onSearchParts={() => setCurrentScreen('SEARCH_PARTS')} onOpenOrders={() => setCurrentScreen('ORDERS')} onOpenSupport={() => setCurrentScreen('SUPPORT')} />;
      case 'SUPPORT':
        return <SupportScreen user={user} onBack={goDash} />;
      case 'NEW_REQUEST':
        return <NewRequestScreen onCancel={goDash} onSubmit={goDash} user={user} />;
      case 'SEARCH_PARTS':
        return <SearchPartsScreen onBack={() => setCurrentScreen('CUSTOMER_DASHBOARD')} user={user} onMakeOrder={() => setCurrentScreen('ORDERS')} />;
      case 'ORDERS':
        return <OrdersScreen user={user} onBack={goDash} />;
      case 'DEALER_DASHBOARD':
        return <DealerDashboard onLogout={handleLogout} user={user} onProfile={goProfile} onOpenInventory={() => setCurrentScreen('DEALER_INVENTORY')} onOpenOrders={() => setCurrentScreen('ORDERS')} onOpenSupport={() => setCurrentScreen('SUPPORT')} />;
      case 'DEALER_INVENTORY':
        return <DealerInventoryScreen user={user} onBack={goDash} />;
      case 'ADMIN_DASHBOARD':
        return <AdminDashboard onLogout={handleLogout} />;
      case 'PROFILE':
        return <ProfileScreen user={user} onBack={goDash} />;
      case 'OFFER_DETAILS':
        return <OfferDetailsScreen request={selectedRequest} onBack={goDash} user={user} onMakeOrder={() => setCurrentScreen('ORDERS')} />;
      default:
        return <AuthScreen 
                  onLogin={handleLogin} 
                  onNavCustomer={() => setCurrentScreen('REG_CUSTOMER')}
                  onNavDealer={() => setCurrentScreen('REG_DEALER')}
               />;
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      {renderScreen()}
    </>
  );
}
