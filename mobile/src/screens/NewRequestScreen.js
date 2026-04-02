import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, Alert, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { COLORS } from '../theme';
import { API_URL } from '../config';

const CATEGORIES = ['Motor', 'Kaporta', 'Elektrik', 'Yürüyen', 'Fren', 'İç Aksam'];
const PREFERENCES = [
  { id: 'CIKMA', name: 'Kesinlikle Çıkma' },
  { id: 'SIFIR_ORIJINAL', name: 'Sıfır (Orijinal)' },
  { id: 'SIFIR_YAN_SANAYI', name: 'Sıfır (Yan Sanayi)' },
  { id: 'FARKETMEZ', name: 'Farketmez' }
];

export default function NewRequestScreen({ user, onCancel, onSubmit }) {
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [part, setPart] = useState('');
  const [category, setCategory] = useState('');
  const [pref, setPref] = useState('FARKETMEZ');
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.5 });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const handlePublish = async () => {
    if (!brand || !model || !year || !part || !category) {
      return Alert.alert('Hata', 'Lütfen tüm boşlukları doldurun ve Kategori seçin.');
    }

    setLoading(true);
    try {
      const payload = {
          customerId: user._id, brand, model, year, partName: part,
          description: category, conditionPreference: pref
      };

      const res = await fetch(`${API_URL}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Alert.alert('Başarılı', `Parça talebiniz ilgili satıcılarının (Sadece ${pref === 'FARKETMEZ' ? 'Tümü' : pref} Satanlar) cebine düştü!`);
      onSubmit(); 
    } catch (error) {
      Alert.alert('Hata', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backBtn}><Text style={styles.backText}>İptal</Text></TouchableOpacity>
        <Text style={styles.pageTitle}>Talep Oluştur</Text><View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.label}>Araç Markası ve Modeli (Örn: Renault Megane)</Text>
        <View style={{flexDirection: 'row', gap: 10}}>
          <TextInput style={[styles.input, {flex: 1}]} value={brand} onChangeText={setBrand} placeholder="Marka" placeholderTextColor={COLORS.textSecondary} />
          <TextInput style={[styles.input, {flex: 1}]} value={model} onChangeText={setModel} placeholder="Model" placeholderTextColor={COLORS.textSecondary} />
        </View>

        <Text style={styles.label}>Nasıl Bir Parça Arıyorsunuz? (Sadece bu türü satanlara gider)</Text>
        <View style={{flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20}}>
           {PREFERENCES.map(p => (
             <TouchableOpacity key={p.id} style={[styles.prefBtn, pref === p.id && styles.prefActiveBtn]} onPress={() => setPref(p.id)}>
                 <Text style={[styles.catText, pref === p.id && {color: COLORS.primary}]}>{p.name}</Text>
             </TouchableOpacity>
           ))}
        </View>

        <Text style={styles.label}>Model Yılı</Text>
        <TextInput style={styles.input} value={year} onChangeText={setYear} keyboardType="numeric" placeholder="Örn: 2015" placeholderTextColor={COLORS.textSecondary} />

        <Text style={styles.label}>Kategori Seçin</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{marginBottom: 20}}>
           {CATEGORIES.map(cat => (
             <TouchableOpacity key={cat} style={[styles.catBtn, category === cat && styles.catActiveBtn]} onPress={() => setCategory(cat)}>
                 <Text style={[styles.catText, category === cat && {color: COLORS.primary}]}>{cat}</Text>
             </TouchableOpacity>
           ))}
        </ScrollView>

        <Text style={styles.label}>Aranan Parça Adı</Text>
        <TextInput style={styles.input} value={part} onChangeText={setPart} placeholder="Örn: Sağ Ön Far" placeholderTextColor={COLORS.textSecondary} />

        <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
          {photo ? <Image source={{uri: photo}} style={{width: 100, height: 100, borderRadius: 12}} /> : <Text style={styles.photoText}>📷 Kırık / Aranan Parça Fotoğrafı Ekle</Text>}
        </TouchableOpacity>

        {loading ? <ActivityIndicator size="large" color={COLORS.primary} /> : 
          <TouchableOpacity style={styles.submitBtn} onPress={handlePublish}><Text style={styles.submitText}>Talebi Yayınla</Text></TouchableOpacity>
        }
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 24, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: 8 }, backText: { color: COLORS.textSecondary, fontSize: 16 },
  pageTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  form: { padding: 24 }, label: { color: COLORS.textSecondary, marginBottom: 8, fontSize: 13, fontWeight: 'bold' },
  input: { backgroundColor: COLORS.card, color: COLORS.textPrimary, padding: 16, borderRadius: 12, marginBottom: 15, borderWidth: 1, borderColor: COLORS.border, fontSize: 16 },
  catBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, marginRight: 10, backgroundColor: COLORS.card, height: 40 },
  catActiveBtn: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  prefBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, marginRight: 8, marginBottom: 8, backgroundColor: COLORS.card },
  prefActiveBtn: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  catText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 13 },
  photoUpload: { backgroundColor: COLORS.primaryDim, borderStyle: 'dashed', borderWidth: 1, borderColor: COLORS.primary, borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 30, justifyContent: 'center' },
  photoText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 14 },
  submitBtn: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 16, alignItems: 'center' },
  submitText: { color: '#FFF', fontSize: 18, fontWeight: 'bold' }
});
