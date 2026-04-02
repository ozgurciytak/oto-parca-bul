import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, TextInput, ActivityIndicator, Modal } from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';

export default function OfferDetailsScreen({ user, request, onBack }) {
  const [loading, setLoading] = useState(false);
  const [questionModal, setQuestionModal] = useState(false);
  const [question, setQuestion] = useState('');

  const handleBuy = async () => {
    Alert.alert(
      'Güvenli Ödeme',
      'Ödemeyi şimdi uygulama üzerinden yaparak paranızı blokaja alıyoruz. Ürün elinize ulaşıp onay verene kadar ücret satıcıya aktarılmaz.',
      [{ text: 'İptal', style: 'cancel' }, { text: 'ÖDEME YAP', onPress: () => processPayment() }]
    );
  };

  const handleAskQuestion = async () => {
    if(!question) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/messages/send`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ from: user._id, to: request.dealerId?._id || request.dealerId, content: question })
      });
      const data = await res.json();
      if(res.ok) {
        Alert.alert('Başarılı', 'Sorunuz satıcıya iletildi.');
        setQuestionModal(false);
        setQuestion('');
      } else {
        Alert.alert('⚠️ DİKKAT!', data.message || 'Kural ihlali tespit edildi.');
      }
    } catch(e) {}
    setLoading(false);
  };

  const processPayment = async () => {
    setLoading(true);
    setTimeout(() => {
        Alert.alert('Başarılı', 'Ödemeniz alındı ve siparişiniz oluşturuldu!');
        onBack();
    }, 1500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={{color: COLORS.primary, fontWeight: 'bold'}}>← VAZGEÇ</Text></TouchableOpacity>
        <Text style={styles.title}>Teklif Detayı</Text><View style={{width: 50}} />
      </View>

      <ScrollView contentContainerStyle={{padding: 20}}>
          <View style={styles.card}>
              <Text style={styles.brandText}>{request.brand} {request.model}</Text>
              <Text style={styles.partText}>{request.partName}</Text>
              <View style={styles.divider} />
              <View style={styles.row}><Text style={styles.label}>FİYAT:</Text><Text style={styles.price}>{request.price || 0} TL</Text></View>
              <View style={[styles.row, {alignItems: 'center'}]}>
                 <Text style={styles.label}>SATICI:</Text>
                 <Text style={styles.dealerName}>{request.dealerId?.name || 'Mert Oto'}</Text>
                 <TouchableOpacity style={styles.askBtn} onPress={() => setQuestionModal(true)}><Text style={styles.askText}>SORU SOR 💬</Text></TouchableOpacity>
              </View>
          </View>

          <View style={styles.safetyBox}>
              <Text style={styles.safetyTitle}>🛡️ PARANIZI KORUYUN!</Text>
              <Text style={styles.safetyDesc}>Paranızı korumak için esnaf ile dışarıdan iletişime geçmeyin. Telefon veya mail paylaşan kullanıcılar SİSTEMDEN MEN EDİLİR.</Text>
          </View>

          <TouchableOpacity style={styles.buyBtn} onPress={handleBuy} disabled={loading}>
              {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buyText}>GÜVENLİ ÖDEME İLE SATIN AL</Text>}
          </TouchableOpacity>
      </ScrollView>

      {/* SORU SORMA MODALI */}
      <Modal visible={questionModal} transparent animationType="slide">
          <View style={styles.modalBg}><View style={styles.modalCard}>
             <Text style={styles.modalTitle}>Satıcıya Soru Sorun</Text>
             <Text style={styles.modStatus}>⚠️ Telefon/Mail yazmak yasaktır.</Text>
             <TextInput style={[styles.input, {height: 120}]} placeholder="Parça durumu, uyumluluk vb. sorun..." placeholderTextColor="#666" value={question} onChangeText={setQuestion} multiline />
             <TouchableOpacity style={styles.sendBtn} onPress={handleAskQuestion} disabled={loading}>
                {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.sendBtnText}>GÖNDER</Text>}
             </TouchableOpacity>
             <TouchableOpacity style={{marginTop: 15}} onPress={() => setQuestionModal(false)}><Text style={{color: '#666', textAlign: 'center'}}>Kapat</Text></TouchableOpacity>
          </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  card: { backgroundColor: COLORS.card, padding: 30, borderRadius: 28, borderWidth: 1, borderColor: COLORS.border, marginBottom: 25 },
  brandText: { color: COLORS.primary, fontSize: 14, fontWeight: 'bold', marginBottom: 5 },
  partText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15, alignItems: 'center' },
  label: { color: COLORS.textSecondary, fontSize: 13 },
  price: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  dealerName: { color: '#FFF', fontWeight: 'bold', flex: 1, marginLeft: 10 },
  askBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  askText: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold' },
  safetyBox: { backgroundColor: 'rgba(52,199,89,0.1)', padding: 20, borderRadius: 20, borderWidth: 1, borderColor: '#34C759', marginBottom: 25 },
  safetyTitle: { color: '#34C759', fontSize: 13, fontWeight: 'bold', marginBottom: 10 },
  safetyDesc: { color: '#FFF', fontSize: 11, lineHeight: 16, opacity: 0.9 },
  buyBtn: { backgroundColor: COLORS.primary, padding: 22, borderRadius: 20, alignItems: 'center' },
  buyText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '85%', backgroundColor: COLORS.card, padding: 30, borderRadius: 25, borderWidth: 1, borderColor: COLORS.primaryDim },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modStatus: { color: '#ff4444', fontSize: 11, textAlign: 'center', marginBottom: 15, fontWeight: 'bold' },
  input: { backgroundColor: COLORS.background, color: '#FFF', padding: 18, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border },
  sendBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 15 },
  sendBtnText: { color: '#FFF', fontWeight: 'bold' }
});
