import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, StyleSheet } from 'react-native';
import { COLORS } from '../theme';

// MVP amaçlı 5 ilin ilişkili verisi (Gerçek sistemde 81 il ve 50.000+ mahalle veritabanından çekilecektir)
const MOCK_DB = {
  "İstanbul": { 
     "Kadıköy": ["Bostancı", "Caddebostan", "Suadiye", "Fenerbahçe"], 
     "Beşiktaş": ["Bebek", "Etiler", "Levent", "Ortaköy"],
     "Şişli": ["Mecidiyeköy", "Teşvikiye", "Fulya"]
  },
  "Ankara": { 
     "Çankaya": ["Kızılay", "Dikmen", "Çayyolu", "Bahçelievler"], 
     "Keçiören": ["Etlik", "Aktepe", "Bağlum"] 
  },
  "İzmir": { 
     "Karşıyaka": ["Bostanlı", "Mavişehir", "Donanmacı"], 
     "Bornova": ["Evka 3", "Kazımdirik", "Özkanlar"] 
  },
  "Bursa": { 
     "Nilüfer": ["Özlüce", "Görükle", "Fethiye"], 
     "Osmangazi": ["Çekirge", "Demirtaş", "Alemdar"] 
  },
  "Antalya": { 
     "Muratpaşa": ["Lara", "Şirinyalı", "Kaleiçi"], 
     "Konyaaltı": ["Hurma", "Liman", "Sarısu"] 
  }
};

export default function LocationPicker({ onChange, defaultCity = '', defaultDistrict = '', defaultNeighborhood = '' }) {
  const [city, setCity] = useState(defaultCity);
  const [district, setDistrict] = useState(defaultDistrict);
  const [neighborhood, setNeighborhood] = useState(defaultNeighborhood);

  const [modalType, setModalType] = useState(null); // 'CITY' | 'DISTRICT' | 'NEIGHBORHOOD'

  const cities = Object.keys(MOCK_DB);
  const districts = city ? Object.keys(MOCK_DB[city]) : [];
  const neighborhoods = district ? MOCK_DB[city][district] : [];

  const handleSelect = (val) => {
    if (modalType === 'CITY') {
      setCity(val);
      setDistrict('');
      setNeighborhood('');
      onChange(val, '', '');
    } else if (modalType === 'DISTRICT') {
      setDistrict(val);
      setNeighborhood('');
      onChange(city, val, '');
    } else if (modalType === 'NEIGHBORHOOD') {
      setNeighborhood(val);
      onChange(city, district, val);
    }
    setModalType(null);
  };

  return (
    <View style={styles.container}>
       <TouchableOpacity style={styles.btn} onPress={() => setModalType('CITY')}>
         <Text style={[styles.btnText, city ? styles.selectedText : null]}>{city || 'İl Seçin (Zorunlu)'}</Text>
       </TouchableOpacity>
       
       <TouchableOpacity style={[styles.btn, !city && styles.disabledBtn]} disabled={!city} onPress={() => setModalType('DISTRICT')}>
         <Text style={[styles.btnText, district ? styles.selectedText : null]}>{district || 'İlçe Seçin (Zorunlu)'}</Text>
       </TouchableOpacity>
       
       <TouchableOpacity style={[styles.btn, !district && styles.disabledBtn]} disabled={!district} onPress={() => setModalType('NEIGHBORHOOD')}>
         <Text style={[styles.btnText, neighborhood ? styles.selectedText : null]}>{neighborhood || 'Mahalle Seçin (Zorunlu)'}</Text>
       </TouchableOpacity>

       <Modal visible={!!modalType} transparent animationType="fade">
          <View style={styles.modalBg}>
             <View style={styles.modalCard}>
                <Text style={styles.modalTitle}>
                  {modalType === 'CITY' ? 'İl Seçin' : modalType === 'DISTRICT' ? 'İlçe Seçin' : 'Mahalle Seçin'}
                </Text>
                <ScrollView>
                   {(modalType === 'CITY' ? cities : modalType === 'DISTRICT' ? districts : neighborhoods).map(item => (
                      <TouchableOpacity key={item} style={styles.modalItem} onPress={() => handleSelect(item)}>
                         <Text style={styles.modalItemText}>{item}</Text>
                      </TouchableOpacity>
                   ))}
                </ScrollView>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setModalType(null)}>
                   <Text style={{color: '#fff', fontWeight: 'bold'}}>İptal</Text>
                </TouchableOpacity>
             </View>
          </View>
       </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 15 },
  btn: { backgroundColor: COLORS.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primaryDim, marginBottom: 10, alignItems: 'center' },
  disabledBtn: { opacity: 0.5, borderColor: COLORS.border },
  btnText: { color: COLORS.textSecondary, fontSize: 15, fontWeight: 'bold' },
  selectedText: { color: COLORS.primary },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: COLORS.background, borderRadius: 16, padding: 20, maxHeight: 500, borderWidth: 1, borderColor: COLORS.primaryDim },
  modalTitle: { color: COLORS.primary, fontSize: 18, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  modalItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalItemText: { color: COLORS.textPrimary, fontSize: 16, textAlign: 'center' },
  closeBtn: { backgroundColor: COLORS.primary, padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 15 }
});
