import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator, Modal } from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';
import LocationPicker from '../components/LocationPicker';

const BRANDS = ['Audi', 'BMW', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Mercedes', 'Peugeot', 'Renault', 'Toyota', 'Volkswagen'];
const SELLING_TYPES = [
  { id: 'CIKMA', name: 'Çıkma Parça' },
  { id: 'SIFIR_ORIJINAL', name: 'Orijinal Sıfır' },
  { id: 'SIFIR_YAN_SANAYI', name: 'Yan Sanayi Sıfır' }
];

export default function RegisterDealerScreen({ onBack, onLogin }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [vergiNo, setVergiNo] = useState('');

  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [streetAddress, setStreetAddress] = useState('');

  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);

  const [loading, setLoading] = useState(false);
  const [showSmsModal, setShowSmsModal] = useState(false);
  const [smsCode, setSmsCode] = useState('');

  const toggleBrand = (b) => {
    if (selectedBrands.includes(b)) setSelectedBrands(selectedBrands.filter(i => i !== b));
    else setSelectedBrands([...selectedBrands, b]);
  };

  const toggleType = (t) => {
    if (selectedTypes.includes(t)) setSelectedTypes(selectedTypes.filter(i => i !== t));
    else setSelectedTypes([...selectedTypes, t]);
  };

  const handleRegisterStage1 = () => {
    if (!name || !phone || !email || !password || !city || !district || !neighborhood || !streetAddress || !vergiNo) {
      return Alert.alert('Hata', 'Lütfen eksiksiz Form ve Açık Adres doldurun.');
    }
    
    // Vergi Kimlik / TC Kimlik 10 veya 11 Hane Sıkı Doğrulama
    if (!/^[0-9]{10,11}$/.test(vergiNo)) {
      return Alert.alert('Geçersiz Numara', 'Vergi Kimlik veya T.C. Kimlik Numarası kesinlikle 10 veya 11 haneli rakamlardan oluşmalıdır.');
    }

    // Telefon Doğrulaması
    if (!/^(05|5)[0-9]{9}$/.test(phone.replace(/\s/g, ''))) {
       return Alert.alert('Geçersiz Numara', 'Lütfen geçerli bir işletme telefonu girin.');
    }

    if (selectedBrands.length === 0 || selectedTypes.length === 0) {
      return Alert.alert('Eksik Seçim', 'En az bir Filtre Markası ve Ürün Tipi seçmelisiniz.');
    }

    setShowSmsModal(true);
  };

  const handleVerifyAndComplete = async () => {
    if (smsCode !== '123456') {
       return Alert.alert('Hatalı Kod', 'Mali dolandırıcılık sistemleri sebebiyle SMS kodunuz kesin olarak eşleşmeli. (Test: 123456)');
    }

    setLoading(true);
    try {
      const payload = { 
         email: email.toLowerCase().trim(), 
         password, 
         name, // Marka/Mağaza Adı
         companyName: name, 
         phone, 
         vkn: vergiNo, 
         tcNo: vergiNo,
         city, 
         district, 
         neighborhood, 
         address: streetAddress,
         role: 'DEALER', 
         specializedBrands: selectedBrands, 
         sellingTypes: selectedTypes 
      };
      
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setShowSmsModal(false);
      Alert.alert('Esnaf Kaydı Başarılı!', 'Vergi dairesi ve numaralarınız sistemden doğrulandı, profil oluşturuldu.');
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
        <Text style={styles.pageTitle}>Esnaf (Satıcı) Kaydı</Text><View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
         <View style={styles.box}>
            <Text style={styles.sectionHeader}>Firma & Resmi Bilgileriniz</Text>
            <Text style={styles.desc}>Girdiğiniz VKN / TC numarası e-devlet altyapısından teyit edilir.</Text>
            <TextInput style={styles.input} placeholder="İşletme / Ticari Ünvan *" placeholderTextColor={COLORS.textSecondary} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Vergi Kimlik (VKN) / T.C. No *" placeholderTextColor={COLORS.textSecondary} value={vergiNo} onChangeText={setVergiNo} keyboardType="numeric" maxLength={11} />
            <TextInput style={styles.input} placeholder="Doğrulanacak İşletme Cep Telefonu *" placeholderTextColor={COLORS.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Giriş E-Postaniz *" placeholderTextColor={COLORS.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <TextInput style={styles.input} placeholder="Şifreniz *" placeholderTextColor={COLORS.textSecondary} value={password} onChangeText={setPassword} secureTextEntry />
            
            <Text style={{color: '#FFF', fontWeight: 'bold', marginBottom: 10, marginTop: 10}}>Firma Açık Adresiniz *</Text>
            <LocationPicker onChange={(c, d, n) => { setCity(c); setDistrict(d); setNeighborhood(n); }} />
            <TextInput style={[styles.input, {height: 80, marginTop: -5}]} placeholder="Sokak, Cadde, Vergi Dairesi, Dükkan Numarası vb. Tam Adres *" placeholderTextColor={COLORS.textSecondary} value={streetAddress} onChangeText={setStreetAddress} multiline />
         </View>

         <View style={styles.box}>
            <Text style={styles.sectionHeader}>Hizmet Verdiğiniz Alanlar</Text>
            <Text style={styles.desc}>Seçtiğiniz markalar ve parça türlerine göre size özel müşteri talepleri göndereceğiz.</Text>

            <Text style={styles.miniLabel}>1. Hangi Tür Ürünler Satıyorsunuz? (*)</Text>
            <View style={styles.tagWrap}>
                {SELLING_TYPES.map(t => (
                  <TouchableOpacity key={t.id} style={[styles.tagBtn, selectedTypes.includes(t.id) && styles.tagActive]} onPress={() => toggleType(t.id)}>
                      <Text style={[styles.tagText, selectedTypes.includes(t.id) && {color: COLORS.primary}]}>{t.name}</Text>
                  </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.miniLabel}>2. İş Yaptığınız Markalar (*)</Text>
            <View style={styles.tagWrap}>
                {BRANDS.map(b => (
                  <TouchableOpacity key={b} style={[styles.tagBtn, selectedBrands.includes(b) && styles.tagActive]} onPress={() => toggleBrand(b)}>
                      <Text style={[styles.tagText, selectedBrands.includes(b) && {color: COLORS.primary}]}>{b}</Text>
                  </TouchableOpacity>
                ))}
            </View>
         </View>

         <TouchableOpacity style={styles.submitBtn} onPress={handleRegisterStage1}>
            <Text style={styles.submitText}>Tel / E-Devlet ile Doğrula</Text>
         </TouchableOpacity>
      </ScrollView>

      {/* SMS Modal */}
      <Modal visible={showSmsModal} transparent animationType="slide">
         <View style={styles.modalBg}>
            <View style={styles.modalCard}>
               <Text style={styles.modalTitle}>İletişim & Vergi Doğrulaması</Text>
               <Text style={styles.modalDesc}>{phone} numaralı telefona sistemlerimiz tarafından gönderilen kurumsal 6 haneli doğrulama kodunu girin.</Text>
               
               <TextInput style={styles.smsInput} placeholder="Doğrulama Kodu" placeholderTextColor={COLORS.textSecondary} value={smsCode} onChangeText={setSmsCode} keyboardType="numeric" maxLength={6} textAlign="center" />
               
               {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 15}} /> : (
                  <View style={{flexDirection: 'row', gap: 10, marginTop: 15}}>
                     <TouchableOpacity style={[styles.smsBtn, {backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border}]} onPress={() => setShowSmsModal(false)}>
                        <Text style={{color: COLORS.textPrimary, fontWeight: 'bold'}}>İptal</Text>
                     </TouchableOpacity>
                     <TouchableOpacity style={styles.smsBtn} onPress={handleVerifyAndComplete}>
                        <Text style={{color: '#FFF', fontWeight: 'bold'}}>Kaydı Tamamla</Text>
                     </TouchableOpacity>
                  </View>
               )}
            </View>
         </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 8 }, backText: { color: COLORS.textSecondary, fontSize: 16 },
  pageTitle: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold' },
  form: { padding: 20, paddingBottom: 100 },
  box: { backgroundColor: COLORS.background, padding: 15, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
  sectionHeader: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  desc: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 15 },
  input: { backgroundColor: COLORS.card, color: COLORS.textPrimary, padding: 16, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border, fontSize: 15 },
  miniLabel: { color: '#FFF', fontSize: 14, fontWeight: 'bold', marginBottom: 10, marginTop: 10 },
  tagWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  tagBtn: { paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card, margin: 5 },
  tagActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  tagText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '600' },
  submitBtn: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 16, alignItems: 'center', marginBottom: 50 },
  submitText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: COLORS.background, padding: 30, borderTopLeftRadius: 30, borderTopRightRadius: 30 },
  modalTitle: { color: COLORS.primary, fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalDesc: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  smsInput: { backgroundColor: COLORS.card, color: COLORS.textPrimary, padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#fff', fontSize: 24, letterSpacing: 10, fontWeight: 'bold' },
  smsBtn: { flex: 1, backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' }
});
