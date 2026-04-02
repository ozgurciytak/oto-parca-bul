import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert, TextInput, Modal, ScrollView } from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';
import ChatScreen from './ChatScreen'; // YENİ EKLEME

export default function OrdersScreen({ user, onBack }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [shipModalVisible, setShipModalVisible] = useState(false);
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [cargoCompany, setCargoCompany] = useState('');
  const [trackingCode, setTrackingCode] = useState('');

  // SOHBET İÇİN STATE
  const [chatOpen, setChatOpen] = useState(false);
  const [receiverId, setReceiverId] = useState(null);
  const [receiverName, setReceiverName] = useState('');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/${user._id}`);
      const data = await res.json();
      if(res.ok) setOrders(data);
    } catch(e) { Alert.alert('Hata', 'Çekilemedi.'); }
    finally { setLoading(false); }
  };

  const translateStatus = (s) => {
    switch(s) {
        case 'PAID': return '💰 ÖDENDİ / HAZIRLANIYOR';
        case 'SHIPPED': return '🚚 KARGOYA VERİLDİ';
        case 'CANCELLED': return '❌ İPTAL EDİLDİ';
        case 'COMPLETED': return '✅ TAMAMLANDI';
        case 'DISPUTE': return '⚠️ SORUN BİLDİRİLDİ';
        case 'REFUNDED': return '💸 İADE EDİLDİ';
        default: return s;
    }
  };

  const getStatusColor = (s) => {
      switch(s) {
        case 'PAID': return '#FFA500';
        case 'SHIPPED': return '#007AFF';
        case 'CANCELLED': return '#FF4444';
        case 'COMPLETED': return '#34C759';
        case 'DISPUTE': return '#FF4444';
        case 'REFUNDED': return '#8E44AD';
        default: return '#666';
      }
  };

  const handleCancelOrder = (id) => {
    Alert.alert('İPTAL ONAYI ⚠️', 'Siparişi iptal etmek istediğinize emin misiniz? Para iade süreci başlar.', [
        { text: 'Vazgeç' }, { text: 'Evet, İptal Et', style: 'destructive', onPress: async () => {
            const res = await fetch(`${API_URL}/orders/${id}/cancel`, { method: 'PUT' });
            if(res.ok) fetchOrders();
        }}
    ]);
  };

  const handleShipOrder = async () => {
    if(!cargoCompany || !trackingCode) return Alert.alert('Hata', 'Bilgileri girin.');
    await fetch(`${API_URL}/orders/${activeOrderId}/ship`, {
        method: 'PUT', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ cargoCompany, trackingCode })
    });
    setShipModalVisible(false); fetchOrders();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.partName}>{item.partName}</Text>
        <Text style={styles.amount}>{item.amount} TL</Text>
      </View>
      
      <View style={[styles.statusBadge, {borderColor: getStatusColor(item.status)}]}>
          <Text style={{color: getStatusColor(item.status), fontWeight: 'bold', fontSize: 10}}>{translateStatus(item.status)}</Text>
      </View>

      <View style={styles.addressBox}>
          <Text style={styles.customerName}>{user.role === 'DEALER' ? item.customerId?.name : item.dealerId?.name}</Text>
          <Text style={styles.phoneText}>📞 {user.role === 'DEALER' ? item.customerId?.phone : item.dealerId?.phone}</Text>
          {user.role === 'DEALER' && (
              <Text style={{color: '#AAA', fontSize: 13}}>{item.customerId?.city} / {item.customerId?.district} - {item.customerId?.address}</Text>
          )}
      </View>

      <View style={styles.actionRow}>
          {item.status === 'PAID' && (
              <View style={{flexDirection: 'row', gap: 10, marginTop: 10}}>
                  <TouchableOpacity style={styles.msgBtn} onPress={() => { 
                      setReceiverId(user.role === 'DEALER' ? item.customerId?._id : item.dealerId?._id); 
                      setReceiverName(user.role === 'DEALER' ? item.customerId?.name : item.dealerId?.name);
                      setChatOpen(true); 
                  }}>
                      <Text style={styles.msgBtnText}>💬 MESAJ YAZ</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => handleCancelOrder(item._id)}>
                      <Text style={styles.cancelBtnText}>❌ İPTAL ET</Text>
                  </TouchableOpacity>
              </View>
          )}
          
          {user.role === 'DEALER' && item.status === 'PAID' && (
              <TouchableOpacity style={styles.shipBtn} onPress={() => { setActiveOrderId(item._id); setShipModalVisible(true); }}>
                  <Text style={styles.shipBtnText}>📦 KARGOYA VER</Text>
              </TouchableOpacity>
          )}

          {user.role === 'CUSTOMER' && item.status === 'SHIPPED' && (
              <TouchableOpacity style={styles.completeBtn} onPress={() => {
                  Alert.alert('Onay', 'Ürünü aldınız mı?', [{text: 'Hayır'}, {text: 'Evet', onPress: async () => { await fetch(`${API_URL}/orders/${item._id}/complete`, {method: 'PUT'}); fetchOrders(); }}]);
              }}>
                  <Text style={styles.completeText}>✅ ÜRÜNÜ ALDIM, ONAYLA</Text>
              </TouchableOpacity>
          )}

          {item.status === 'SHIPPED' && (
              <View style={styles.cargoInfo}><Text style={{color: '#FFF', fontSize: 12}}>📍 {item.cargoCompany} - {item.trackingCode}</Text></View>
          )}
      </View>
    </View>
  );

  if (chatOpen) return <ChatScreen user={user} receiverId={receiverId} receiverName={receiverName} onBack={() => setChatOpen(false)} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={{color: COLORS.primary, fontWeight: 'bold'}}>← GERİ</Text></TouchableOpacity>
        <Text style={styles.title}>Siparişler</Text><View style={{width: 50}} />
      </View>
      <FlatList data={orders} renderItem={renderItem} keyExtractor={item => item._id} contentContainerStyle={{padding: 20}} />

      <Modal visible={shipModalVisible} transparent animationType="slide"><View style={styles.modalBg}><View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Kargo Bilgisi</Text>
          <TextInput style={styles.input} placeholder="Kargo Firması" value={cargoCompany} onChangeText={setCargoCompany} placeholderTextColor="#666" />
          <TextInput style={styles.input} placeholder="Takip No" value={trackingCode} onChangeText={setTrackingCode} placeholderTextColor="#666" />
          <TouchableOpacity style={styles.shipBtn} onPress={handleShipOrder}><Text style={styles.shipBtnText}>KAYDET VE BİLDİR</Text></TouchableOpacity>
      </View></View></Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.card },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: COLORS.card, padding: 25, borderRadius: 24, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  partName: { color: '#FFF', fontSize: 18, fontWeight: 'bold', flex: 1 },
  amount: { color: COLORS.primary, fontSize: 18, fontWeight: '900' },
  statusBadge: { borderWidth: 1, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10, alignSelf: 'flex-start', marginBottom: 15 },
  addressBox: { backgroundColor: 'rgba(255,255,255,0.03)', padding: 15, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)', marginBottom: 15 },
  customerName: { color: '#FFF', fontSize: 14, fontWeight: 'bold' },
  phoneText: { color: '#34C759', fontSize: 12, marginVertical: 5 },
  actionRow: { marginTop: 10 },
  msgBtn: { flex: 1, backgroundColor: 'rgba(0,122,255,0.1)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#007AFF', alignItems: 'center' },
  msgBtnText: { color: '#007AFF', fontSize: 11, fontWeight: 'bold' },
  cancelBtn: { flex: 1, backgroundColor: 'rgba(255,68,68,0.1)', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FF4444', alignItems: 'center' },
  cancelBtnText: { color: '#FF4444', fontSize: 11, fontWeight: 'bold' },
  shipBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 15 },
  shipBtnText: { color: '#FFF', fontWeight: 'bold' },
  completeBtn: { backgroundColor: '#34C759', padding: 18, borderRadius: 15, alignItems: 'center' },
  completeText: { color: '#FFF', fontWeight: 'bold' },
  cargoInfo: { marginTop: 15, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.05)', alignItems: 'center' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: COLORS.card, padding: 30, borderRadius: 25, borderWidth: 1, borderColor: COLORS.primaryDim },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: COLORS.background, color: '#FFF', padding: 18, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, marginBottom: 15 }
});
