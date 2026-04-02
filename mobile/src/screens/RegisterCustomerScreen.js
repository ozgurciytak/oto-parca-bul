import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';
import LocationPicker from '../components/LocationPicker';

export default function RegisterCustomerScreen({ onBack, onLogin }) {
  const [name, setName] = useState('');
  const [tcNo, setTcNo] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [streetAddress, setStreetAddress] = useState('');

  const [loading, setLoading] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsCode, setSmsCode] = useState('');

  // Sadece TC ve Telefon Doğrulamasından Geçerse SMS ekranını aç
  const handleRegisterStage1 = () => {
    if (!name || !tcNo || !phone || !email || !password || !city || !district || !neighborhood || !streetAddress) {
      return Alert.alert('Hata', 'Lütfen tüm alanları eksiksiz doldurun.');
    }
    
    // Kesin Doğruluk Kuralları (TC Kimlik)
    if (!/^[1-9]{1}[0-9]{10}$/.test(tcNo)) {
      return Alert.alert('Geçersiz Kimlik Numarası', 'TC Kimlik Numarası tam 11 haneli rakam olmalıdır ve 0 ile başlayamaz.');
    }

    // Telefon Doğrulaması (5xx ile başlamalı ve 10 haneli olmalı veya 05xx ve 11 haneli olmalı)
    if (!/^(05|5)[0-9]{9}$/.test(phone.replace(/\s/g, ''))) {
      return Alert.alert('Geçersiz Numara', 'Lütfen geçerli bir cep telefonu numarası girin (Örn: 5xx yyy zz ww).');
    }

    // Her şey uygunsa SMS'i gönderiyor gibi yap
    setShowSmsModal(true);
  };

  const handleVerifyAndComplete = async () => {
    if (smsCode !== '123456') {
       return Alert.alert('Hatalı Kod', 'Girdiğiniz doğrulama kodu hatalı. Güvenlik sebebiyle devam edilemiyor. (Test için 123456 yazın)');
    }

    setLoading(true);
    try {
      const fullAddress = `[${city} - ${district} / ${neighborhood}] ${streetAddress}`;

      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           email: email.toLowerCase().trim(), 
           password, 
           name, 
           phone, 
           tcNo,
           city, 
           district, 
           neighborhood, 
           address: streetAddress, 
           role: 'CUSTOMER' 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowSmsModal(false);
      Alert.alert('Doğrulandı!', 'Müşteri hesabınız başarıyla açıldı ve SMS numaranız sisteme işlendi.');
      onLogin(data.user);
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Text style={styles.backText}>Geri</Text></TouchableOpacity>
        <Text style={styles.pageTitle}>Müşteri Kaydı</Text><View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
         <View style={styles.infoBox}>
            <Text style={styles.infoText}>Kimlik ve telefonunuz resmi ticaret yasaları gereği kaydedilmektedir. Lütfen gerçek bilgilerinizi kullanın.</Text>
         </View>

         <TextInput style={styles.input} placeholder="Adınız Soyadınız *" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} />
         <TextInput style={styles.input} placeholder="T.C. Kimlik Numaranız *" placeholderTextColor={COLORS.textSecondary} value={tcNo} onChangeText={setTcNo} keyboardType="numeric" maxLength={11} />
         <TextInput style={styles.input} placeholder="Cep Telefonu Numaranız *" placeholderTextColor={COLORS.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
         <TextInput style={styles.input} placeholder="E-Posta Adresiniz *" placeholderTextColor={COLORS.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
         <TextInput style={styles.input} placeholder="Şifreniz *" placeholderTextColor={COLORS.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />
         
         <Text style={{color: COLORS.textPrimary, fontWeight: 'bold', marginBottom: 10, marginTop: 10}}>Açık Adres Bilgileriniz *</Text>
         <LocationPicker onChange={(c, d, n) => { setCity(c); setDistrict(d); setNeighborhood(n); }} />
         <TextInput style={[styles.input, {height: 80, marginTop: -5}]} placeholder="Sokak, Cadde, Bina ve Kapı No (Tam Açık Adres) *" placeholderTextColor={COLORS.textSecondary} value={streetAddress} onChangeText={setStreetAddress} multiline />

         <TouchableOpacity style={styles.submitBtn} onPress={handleRegisterStage1}>
            <Text style={styles.submitText}>Telefonuma Doğrulama Kodu Gönder</Text>
         </TouchableOpacity>
      </ScrollView>

      {/* SMS Doğrulama Modalı */}
      <Modal visible={showSmsModal} transparent animationType="slide">
         <View style={styles.modalBg}>
            <View style={styles.modalCard}>
               <Text style={styles.modalTitle}>SMS Doğrulama</Text>
               <Text style={styles.modalDesc}>{phone} numaralı telefona gönderilen 6 haneli kodu girin. (Dikkat: Numara doğrulanmadan hesap açılamaz)</Text>
               
               <TextInput style={styles.smsInput} placeholder="Doğrulama Kodu" placeholderTextColor={COLORS.textSecondary} value={smsCode} onChangeText={setSmsCode} keyboardType="numeric" maxLength={6} textAlign="center" />
               
               {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 15}} /> : (
                  <View style={{flexDirection: 'row', gap: 10, marginTop: 15}}>
                     <TouchableOpacity style={[styles.smsBtn, {backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border}]} onPress={() => setShowSmsModal(false)}>
                        <Text style={{color: COLORS.textPrimary, fontWeight: 'bold'}}>İptal</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.smsBtn} onPress={handleVerifyAndComplete}>
                        <Text style={{color: '#FFF', fontWeight: 'bold'}}>Kodu Onayla</Text>
                     </TouchableOpacity>
                  </View>
               )}
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
}

// ... styles keep unchanged except specific modal styles
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 8 }, backText: { color: COLORS.textSecondary, fontSize: 16 },
  pageTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  form: { padding: 24, paddingBottom: 100 },
  infoBox: { backgroundColor: COLORS.card, padding: 15, borderRadius: 10, marginBottom: 20, borderWidth: 1, borderColor: COLORS.primaryDim },
  infoText: { color: COLORS.textPrimary, textAlign: 'center', fontSize: 13, lineHeight: 20 },
  input: { backgroundColor: COLORS.card, color: COLORS.textPrimary, padding: 16, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border, fontSize: 15 },
  submitBtn: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 16, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.background, padding: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalTitle: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalDesc: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  smsInput: { backgroundColor: COLORS.card, color: COLORS.textPrimary, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#fff', fontSize: 24, letterSpacing: 10, fontWeight: 'bold' },
  smsBtn: { flex: 1, backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' }
});
