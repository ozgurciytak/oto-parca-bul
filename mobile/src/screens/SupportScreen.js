import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert, Modal, ScrollView } from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';

export default function SupportScreen({ user, onBack }) {
  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [category, setCategory] = useState('GENEL');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = user.role === 'DEALER' 
    ? ['GENEL', 'ÖDEME SORUNU', 'MÜŞTERİ ONAYI', 'KARGO/TESLİMAT', 'DİĞER']
    : ['GENEL', 'ÜRÜN SORUNU/İADE', 'KARGO GECİKMESİ', 'SATICI SORUNU', 'ÖDEME HATASI'];

  useEffect(() => {
    fetchTickets();
    fetchOrders();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${API_URL}/complaints/user/${user._id}`);
      const json = await res.json();
      if (res.ok) setTickets(json);
    } catch (e) {} finally { setLoading(false); }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${API_URL}/orders/${user._id}`);
      const json = await res.json();
      if (res.ok) setOrders(json.filter(o => o.status !== 'COMPLETED')); // Sadece bitmemişler
    } catch (e) {}
  };

  const handleSubmit = async () => {
    if (!message) return Alert.alert('Hata', 'Lütfen sorununuzu açıklayın.');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/complaints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user._id,
          subject: `${category} - ${selectedOrder ? selectedOrder.partName : 'Genel'}`,
          message,
          orderId: selectedOrder?._id,
          role: user.role
        })
      });
      if (res.ok) {
        Alert.alert('Başarılı', 'Talebiniz yönetime iletildi.');
        setModalVisible(false);
        setMessage(''); setSelectedOrder(null);
        fetchTickets();
      }
    } catch (e) {
      Alert.alert('Hata', 'İletilemedi.');
    } finally { setSubmitting(false); }
  };

  const renderTicket = ({ item }) => (
    <View style={styles.ticketCard}>
      <View style={styles.ticketHeader}>
        <Text style={styles.subject}>{item.subject}</Text>
        <View style={[styles.statusBadge, {backgroundColor: item.status === 'CLOSED' ? '#34C75922' : '#FFA50022'}]}>
             <Text style={{color: item.status === 'CLOSED' ? '#34C759' : '#FFA500', fontSize: 10, fontWeight: 'bold'}}>{item.status === 'CLOSED' ? 'ÇÖZÜLDÜ' : 'BEKLEMEDE'}</Text>
        </View>
      </View>
      <Text style={styles.msg}>{item.message}</Text>
      {item.adminReply && (
        <View style={styles.adminReplyBox}>
          <Text style={styles.adminLabel}>Yöneticiden Yanıt:</Text>
          <Text style={styles.adminText}>{item.adminReply}</Text>
        </View>
      )}
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString('tr-TR')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={{color: COLORS.primary, fontWeight: 'bold'}}>← GERİ</Text></TouchableOpacity>
        <Text style={styles.pageTitle}>Destek & İtiraz</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}><Text style={{color: '#FFF', fontWeight: 'bold'}}>YENİ TALEP</Text></TouchableOpacity>
      </View>

      <FlatList
          data={tickets}
          renderItem={renderTicket}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} /> : <Text style={styles.empty}>Henüz bir destek talebiniz bulunmuyor.</Text>}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBg}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Sorun Bildir / Destek İste</Text>
            
            {/* SİPARİŞ SEÇİCİ */}
            <Text style={styles.label}>Hangi sipariş hakkında? (Opsiyonel)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 15}}>
                <TouchableOpacity style={[styles.orderBtn, !selectedOrder && styles.orderBtnActive]} onPress={() => setSelectedOrder(null)}><Text style={{color: !selectedOrder ? '#FFF' : '#666', fontSize: 11}}>Genel</Text></TouchableOpacity>
                {orders.map(o => (
                    <TouchableOpacity key={o._id} style={[styles.orderBtn, selectedOrder?._id === o._id && styles.orderBtnActive]} onPress={() => setSelectedOrder(o)}>
                        <Text style={{color: selectedOrder?._id === o._id ? '#FFF' : '#666', fontSize: 11}}>{o.partName}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* KATEGORİ SEÇİCİ */}
            <Text style={styles.label}>Sorun Kategorisi</Text>
            <View style={styles.catRow}>
                {categories.map(c => (
                    <TouchableOpacity key={c} style={[styles.catBtn, category === c && styles.catBtnActive]} onPress={() => setCategory(c)}>
                        <Text style={{color: category === c ? '#FFF' : '#666', fontSize: 10, fontWeight: 'bold'}}>{c}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TextInput style={[styles.input, { height: 120 }]} placeholder="Sorununuzu detaylıca açıklayınız..." placeholderTextColor="#666" value={message} onChangeText={setMessage} multiline textAlignVertical="top" />
            
            <TouchableOpacity style={styles.saveBtn} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>TALEBİ YÖNETİME İLET</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={{marginTop: 15}} onPress={() => setModalVisible(false)}><Text style={{color: '#666', textAlign: 'center'}}>Vazgeç</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.card },
  pageTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  addBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  list: { padding: 20, paddingBottom: 50 },
  ticketCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 20, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border },
  ticketHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  subject: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14, flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  msg: { color: '#FFF', fontSize: 14, lineHeight: 20 },
  adminReplyBox: { backgroundColor: '#34C75911', padding: 15, borderRadius: 15, marginTop: 15, borderLeftWidth: 3, borderLeftColor: '#34C759' },
  adminLabel: { color: '#34C759', fontWeight: 'bold', fontSize: 12, marginBottom: 5 },
  adminText: { color: '#FFF', fontSize: 13 },
  date: { color: '#444', fontSize: 10, marginTop: 15, textAlign: 'right' },
  empty: { color: '#444', textAlign: 'center', marginTop: 50 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center' },
  modalCard: { backgroundColor: COLORS.card, margin: 20, padding: 30, borderRadius: 30, borderWidth: 1, borderColor: COLORS.primaryDim },
  modalTitle: { color: '#FFF', fontSize: 22, fontWeight: 'bold', marginBottom: 25, textAlign: 'center' },
  label: { color: COLORS.textSecondary, fontSize: 11, marginBottom: 8, fontWeight: 'bold' },
  orderBtn: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, backgroundColor: COLORS.background, marginRight: 8, borderWidth: 1, borderColor: COLORS.border },
  orderBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 15 },
  catBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  catBtnActive: { backgroundColor: '#FFA500', borderColor: '#FFA500' },
  input: { backgroundColor: COLORS.background, color: '#FFF', padding: 15, borderRadius: 15, marginTop: 10, borderWidth: 1, borderColor: COLORS.border },
  saveBtn: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 18, alignItems: 'center', marginTop: 20 },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' }
});
