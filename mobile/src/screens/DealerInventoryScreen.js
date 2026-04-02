import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, TextInput, Alert, Modal, ActivityIndicator, Image } from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';

export default function DealerInventoryScreen({ user, onBack }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItem, setNewItem] = useState({ partName: '', brand: '', model: '', price: '', stock: '1', imageUrl: '' });

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/inventory/dealer/${user._id}`);
      const data = await res.json();
      if(res.ok) setItems(data);
    } catch (e) {}
    setLoading(false);
  };

  const handleAddItem = async () => {
    if (!user.isSubscriptionActive) return Alert.alert('Erişim Engellendi', 'Aboneliğiniz Pasif.');
    if(!newItem.partName || !newItem.price) return Alert.alert('Hata', 'Lütfen parça adı ve fiyat girin.');
    
    // AKILLI FİLTRE (GÖRSEL URL / AÇIKLAMA KONTROLÜ)
    if (newItem.partName.match(/[0-9]{10}/)) return Alert.alert('HATA', 'Telefon yazmak yasaktır!');

    try {
      const res = await fetch(`${API_URL}/inventory/add`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newItem, dealerId: user._id })
      });
      if(res.ok) { setModalVisible(false); fetchInventory(); setNewItem({ partName: '', brand: '', model: '', price: '', stock: '1', imageUrl: '' }); }
    } catch (e) { Alert.alert('Hata', 'Eklenemedi.'); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={{color: COLORS.primary, fontWeight: 'bold'}}>← GERİ</Text></TouchableOpacity>
        <Text style={styles.title}>Stok Yönetimi</Text>
        <TouchableOpacity onPress={() => user.isSubscriptionActive ? setModalVisible(true) : Alert.alert('Hata', 'Abonelik Gerekli')} style={styles.addBtn}><Text style={{color: '#FFF', fontWeight: 'bold'}}>+ EKLE</Text></TouchableOpacity>
      </View>

      <FlatList 
        data={items}
        renderItem={({item}) => (
            <View style={styles.card}>
                {item.imageUrl ? <Image source={{uri: item.imageUrl}} style={styles.pImg} /> : <View style={styles.noImg}><Text style={{fontSize: 10, color: '#666'}}>GÖRSEL YOK</Text></View>}
                <View style={{flex: 1, marginLeft: 15}}><Text style={styles.pName}>{item.partName}</Text><Text style={styles.pDetail}>{item.brand} {item.model}</Text></View>
                <Text style={styles.pPrice}>{item.price} TL</Text>
            </View>
        )}
        keyExtractor={item => item._id}
        contentContainerStyle={{padding: 20}}
        ListEmptyComponent={loading ? <ActivityIndicator /> : <Text style={{color: '#666', textAlign: 'center'}}>Henüz ürün eklemediniz.</Text>}
      />

      {/* ÜRÜN EKLEME MODALI */}
      <Modal visible={modalVisible} transparent animationType="slide">
          <View style={styles.modalBg}><View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Stok Parçası Ekle</Text>
              <TextInput style={styles.input} placeholder="Parça Adı" value={newItem.partName} onChangeText={t => setNewItem({...newItem, partName: t})} />
              <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                 <TextInput style={[styles.input, {width: '48%'}]} placeholder="Marka" value={newItem.brand} onChangeText={t => setNewItem({...newItem, brand: t})} />
                 <TextInput style={[styles.input, {width: '48%'}]} placeholder="Fiyat" value={newItem.price} onChangeText={t => setNewItem({...newItem, price: t})} keyboardType="numeric" />
              </View>
              
              {/* İSTEĞE BAĞLI GÖRSEL YÜKLEME */}
              <TouchableOpacity style={styles.uploadBtn} onPress={() => {
                  Alert.prompt('Görsel URL', 'Parça fotoğrafının internet bağlantısını yapıştırın (Simüle):', [
                    { text: 'Vazgeç' }, { text: 'Tamam', onPress: (url) => setNewItem({...newItem, imageUrl: url}) }
                  ]);
              }}>
                  <Text style={styles.uploadText}>{newItem.imageUrl ? '✅ GÖRSEL EKLENDİ' : '📸 GÖRSEL EKLE (OPSİYONEL)'}</Text>
              </TouchableOpacity>
              {newItem.imageUrl ? <Image source={{uri: newItem.imageUrl}} style={styles.preview} /> : null}

              <TouchableOpacity style={styles.saveBtn} onPress={handleAddItem}><Text style={styles.saveBtnText}>ENVANTERE EKLE</Text></TouchableOpacity>
              <TouchableOpacity style={{marginTop: 15}} onPress={() => setModalVisible(false)}><Text style={{color: '#666', textAlign: 'center'}}>İptal</Text></TouchableOpacity>
          </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: COLORS.border, backgroundColor: COLORS.card },
  title: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  addBtn: { backgroundColor: COLORS.primary, paddingVertical: 8, paddingHorizontal: 15, borderRadius: 10 },
  card: { backgroundColor: COLORS.card, padding: 15, borderRadius: 20, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  pImg: { width: 50, height: 50, borderRadius: 10, backgroundColor: COLORS.background },
  noImg: { width: 50, height: 50, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderStyle: 'dashed', borderColor: '#444' },
  pName: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  pDetail: { color: COLORS.textSecondary, fontSize: 11, marginTop: 3 },
  pPrice: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '90%', backgroundColor: COLORS.card, padding: 25, borderRadius: 25, borderWidth: 1, borderColor: COLORS.primaryDim },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: COLORS.background, color: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  uploadBtn: { backgroundColor: 'rgba(255,255,255,0.05)', padding: 15, borderRadius: 12, borderWidth: 1, borderStyle: 'dotted', borderColor: COLORS.primary, marginBottom: 15, alignItems: 'center' },
  uploadText: { color: COLORS.primary, fontWeight: 'bold', fontSize: 12 },
  preview: { width: '100%', height: 100, borderRadius: 15, marginBottom: 15, backgroundColor: COLORS.background },
  saveBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: 'bold' }
});
