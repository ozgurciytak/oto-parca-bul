import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';

export default function AuthScreen({ onLogin, onNavCustomer, onNavDealer }) {
  const [mode, setMode] = useState('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async () => {
    if (!email || !password) return Alert.alert('Hata', 'Lütfen e-posta ve şifrenizi girin.');
    setLoading(true);
    try {
      console.log('Login denemesi yapiliyor: ', `${API_URL}/auth/login`);
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim(), password })
      });
      
      const data = await res.json();
      console.log("Login cevabı:", data);

      if (res.ok) {
        if (data.user.status === 'SUSPENDED') {
           return Alert.alert('ERİŞİM ENGELİ 🚫', 'Kural ihlali (İletişim bilgisi paylaşımı) nedeniyle hesabınız dondurulmuştur. Lütfen destek ile iletişime geçin.');
        }
        onLogin(data.user);
      } else {
        Alert.alert('Giriş Hatası', data.message || 'Lütfen bilgilerinizi kontrol edin.');
      }
    } catch (error) {
      console.log('Login Hatasi:', error.message);
      Alert.alert('Giriş Başarısız', `Sunucu Mesajı: ${error.message}\n\nIP Adresiniz: ${API_URL}`);
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView style={{flex: 1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>OTO<Text style={styles.logoHighlight}>PARCA</Text></Text>
            <Text style={{color: COLORS.textSecondary, marginTop: 10, textAlign: 'center'}}>Türkiye'nin Lider Çıkma Parça Ağı</Text>
            <Text style={{color: '#333', fontSize: 10, marginTop: 10}}>Sunucu: {API_URL}</Text>
          </View>

          <View style={styles.formContainer}>
            <Text style={styles.pageTitle}>{mode === 'LOGIN' ? 'Giriş Yap' : 'Şifremi Unuttum'}</Text>
            <TextInput style={styles.input} placeholder="E-Posta Adresi (Örn: ahmet@gmail.com)" placeholderTextColor={COLORS.textSecondary} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            {mode === 'LOGIN' && ( <TextInput style={styles.input} placeholder="Şifre" placeholderTextColor={COLORS.textSecondary} value={password} onChangeText={setPassword} secureTextEntry /> )}

            {loading ? <ActivityIndicator size="large" color={COLORS.primary} /> : (
              <TouchableOpacity style={styles.btnPrimary} onPress={handleLoginSubmit}><Text style={styles.btnText}>Sisteme Gir</Text></TouchableOpacity>
            )}
            
            <TouchableOpacity onPress={() => setMode(mode === 'LOGIN' ? 'FORGOT' : 'LOGIN')} style={{marginTop: 15}}>
                <Text style={{color: COLORS.primary, textAlign: 'center', fontWeight: 'bold'}}>{mode === 'LOGIN' ? 'Şifremi Unuttum' : 'Giriş Ekranına Dön'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.registerContainer}>
                <Text style={styles.dividerText}>Hesabınız yok mu? Hemen katılın:</Text>
                <TouchableOpacity style={styles.btnCustomer} onPress={onNavCustomer}>
                   <Text style={styles.btnCustomerText}>👤 Müşteri Hesabı Aç</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnDealer} onPress={onNavDealer}>
                   <Text style={styles.btnDealerText}>🏪 Parçacı (Satıcı) Ol</Text>
                </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24, paddingVertical: 50 },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logoText: { color: COLORS.textPrimary, fontSize: 42, fontWeight: '900', letterSpacing: 1 },
  logoHighlight: { color: COLORS.primary },
  formContainer: { backgroundColor: COLORS.card, padding: 24, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  pageTitle: { color: COLORS.textPrimary, fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: COLORS.background, color: COLORS.textPrimary, padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border, fontSize: 13 },
  btnPrimary: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  registerContainer: { marginTop: 40, alignItems: 'center' },
  dividerText: { color: COLORS.textSecondary, fontSize: 12, marginBottom: 15 },
  btnCustomer: { width: '100%', backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.primaryDim, padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 15 },
  btnCustomerText: { color: COLORS.textPrimary, fontWeight: 'bold', fontSize: 16 },
  btnDealer: { width: '100%', backgroundColor: COLORS.primaryDim, borderWidth: 1, borderColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDealerText: { color: COLORS.primary, fontWeight: '900', fontSize: 16 }
});
