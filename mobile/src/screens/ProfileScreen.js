import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';

const BRANDS = ['Audi', 'BMW', 'Fiat', 'Ford', 'Honda', 'Hyundai', 'Mercedes', 'Peugeot', 'Renault', 'Toyota', 'Volkswagen'];

export default function ProfileScreen({ user, onBack }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [tcNo, setTcNo] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');

  // Esnaf Özel
  const [companyName, setCompanyName] = useState('');
  const [vkn, setVkn] = useState('');
  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');
  const [receiverName, setReceiverName] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/profile/${user._id}`);
      const json = await res.json();
      if (res.ok && json.data) {
        const d = json.data;
        setName(d.name || '');
        setEmail(d.email || '');
        setPhone(d.phone || '');
        setTcNo(d.tcNo || '');
        setCity(d.city || '');
        setDistrict(d.district || '');
        setAddress(d.address || '');
        setCompanyName(d.companyName || '');
        setVkn(d.vkn || '');
        setBankName(d.bankAccount?.bankName || '');
        setIban(d.bankAccount?.iban || '');
        setReceiverName(d.bankAccount?.receiverName || '');
        setSelectedBrands(d.specializedBrands || []);
      }
    } catch (e) {} finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const body = { 
        name, phone, tcNo, city, district, address, companyName, vkn,
        bankAccount: { bankName, iban, receiverName },
        specializedBrands: selectedBrands
      };
      if(password) body.password = password;

      const res = await fetch(`${API_URL}/auth/profile/${user._id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if(res.ok) Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi.');
    } catch (e) { Alert.alert('Hata', 'Güncellenemedi.'); }
    finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={{color: COLORS.primary, fontWeight: 'bold'}}>← GERİ</Text></TouchableOpacity>
        <Text style={styles.title}>Profil Ayarları</Text><View style={{width: 50}} />
      </View>

      {loading ? <ActivityIndicator size="large" color={COLORS.primary} style={{marginTop: 50}} /> : (
        <ScrollView contentContainerStyle={{padding: 20}}>
           <View style={styles.section}>
              <Text style={styles.sectionTitle}>👤 Kişisel Bilgiler</Text>
              <TextInput style={styles.input} placeholder="Ad Soyad" value={name} onChangeText={setName} placeholderTextColor="#666" />
              <TextInput style={[styles.input, {opacity: 0.5}]} placeholder="E-Posta" value={email} editable={false} />
              <TextInput style={styles.input} placeholder="Telefon" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#666" />
              <TextInput style={styles.input} placeholder="TC / Vergi No" value={tcNo} onChangeText={setTcNo} placeholderTextColor="#666" />
           </View>

           <View style={styles.section}>
              <Text style={styles.sectionTitle}>📍 Kargo & Adres Bilgileri</Text>
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                 <TextInput style={[styles.input, {width: '48%'}]} placeholder="Şehir" value={city} onChangeText={setCity} placeholderTextColor="#666" />
                 <TextInput style={[styles.input, {width: '48%'}]} placeholder="İlçe" value={district} onChangeText={setDistrict} placeholderTextColor="#666" />
              </View>
              <TextInput style={[styles.input, {height: 80}]} placeholder="Mahalle, Sokak, No detaylı açık adres..." value={address} onChangeText={setAddress} multiline placeholderTextColor="#666" />
           </View>

           {user.role === 'DEALER' && (
              <>
                 <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🏦 Hakediş Banka Hesabı</Text>
                    <TextInput style={styles.input} placeholder="Banka Adı" value={bankName} onChangeText={setBankName} placeholderTextColor="#666" />
                    <TextInput style={styles.input} placeholder="IBAN (TR...)" value={iban} onChangeText={setIban} placeholderTextColor="#666" />
                    <TextInput style={styles.input} placeholder="Hesap Sahibi" value={receiverName} onChangeText={setReceiverName} placeholderTextColor="#666" />
                 </View>
              </>
           )}

           <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveBtnText}>PROFİLİ GÜNCELLE</Text>}
           </TouchableOpacity>
           <View style={{height: 100}} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.card },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  section: { marginBottom: 25 },
  sectionTitle: { color: COLORS.primary, fontSize: 15, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: COLORS.card, color: '#FFF', padding: 18, borderRadius: 15, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  saveBtn: { backgroundColor: COLORS.primary, padding: 22, borderRadius: 20, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
