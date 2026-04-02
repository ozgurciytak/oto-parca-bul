import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, TextInput, Alert, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';
import OfferDetailsScreen from './OfferDetailsScreen';

export default function SearchPartsScreen({ user, onBack }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReq, setSelectedReq] = useState(null);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/requests/search?q=${query}`);
      const data = await res.json();
      if(res.ok) setResults(data);
    } catch (e) { Alert.alert('Hata', 'Aranırken sorun oluştu.'); }
    setLoading(false);
  };

  if (selectedReq) return <OfferDetailsScreen user={user} request={selectedReq} onBack={() => setSelectedReq(null)} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack}><Text style={{color: COLORS.primary, fontWeight: 'bold'}}>← GERİ</Text></TouchableOpacity>
        <TextInput style={styles.searchInput} placeholder="Parça adı veya marka ara..." placeholderTextColor="#666" value={query} onChangeText={setQuery} onSubmitEditing={handleSearch} />
        <TouchableOpacity onPress={handleSearch}><Text style={{color: COLORS.primary, fontWeight: 'bold'}}>ARA</Text></TouchableOpacity>
      </View>

      {!user.isSubscriptionActive && (
          <View style={styles.lockBanner}>
              <Text style={{color: '#ff4444', fontWeight: 'bold', fontSize: 13}}>⚠️ Aboneliğiniz Pasif. Sadece talepleri izleyebilirsiniz, teklif veremezsiniz.</Text>
          </View>
      )}

      <FlatList 
        data={results}
        renderItem={({item}) => (
            <TouchableOpacity 
                style={[styles.card, !user.isSubscriptionActive && {opacity: 0.5}]} 
                onPress={() => {
                    if(!user.isSubscriptionActive) return Alert.alert('Erişim Engellendi', 'Teklif verebilmek için aylık abonelik ücretinizi ödemeniz gerekmektedir.');
                    setSelectedReq(item);
                }}>
                <View style={{flex: 1}}><Text style={styles.cTitle}>{item.brand} {item.model}</Text><Text style={styles.cPart}>{item.partName}</Text></View>
                <Text style={{color: COLORS.primary, fontWeight: 'bold'}}>{user.isSubscriptionActive ? 'TEKLİF VER →' : 'KİLİTLİ 🔒'}</Text>
            </TouchableOpacity>
        )}
        keyExtractor={item => item._id}
        contentContainerStyle={{padding: 20}}
        ListEmptyComponent={<Text style={{color: '#444', textAlign: 'center', marginTop: 50}}>Henüz bir arama yapmadınız veya sonuç bulunamadı.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 40, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  searchInput: { flex: 1, backgroundColor: COLORS.card, color: '#FFF', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 12, marginHorizontal: 15, borderWidth: 1, borderColor: COLORS.border },
  card: { backgroundColor: COLORS.card, padding: 20, borderRadius: 20, marginBottom: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  cTitle: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  cPart: { color: COLORS.textSecondary, fontSize: 12, marginTop: 4 },
  lockBanner: { backgroundColor: 'rgba(255,0,0,0.1)', padding: 12, marginHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,0,0,0.2)', marginBottom: 10 }
});
