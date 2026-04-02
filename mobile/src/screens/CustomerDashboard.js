import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert, TextInput, ScrollView, RefreshControl, Image, Modal } from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';
import ChatScreen from './ChatScreen';

export default function CustomerDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('MY_REQUESTS'); // MY_REQUESTS, CATALOG, OFFERS, SUPPORT, PROFILE
  const [requests, setRequests] = useState([]);
  const [catalog, setCatalog] = useState([]); // Esnafların yüklediği tüm parçalar 🧩
  const [chatList, setChatList] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [chatOpen, setChatOpen] = useState(false);
  const [receiverId, setReceiverId] = useState(null);
  const [receiverName, setReceiverName] = useState('');

  // KURUMSAL TALEP TERMİNALİ (POP-UP YOK) 🛡️
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReq, setNewReq] = useState({ partName: '', vehicleBrand: '', description: '' });

  // Arama filtresi
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if(activeTab === 'MY_REQUESTS') fetchRequests();
    else if(activeTab === 'CATALOG') fetchCatalog();
    else if(activeTab === 'OFFERS') fetchChatList();
  }, [activeTab]);

  const fetchRequests = async (isPull = false) => {
    if(!isPull) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/requests/customer/${user?._id}`);
      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  };

  const fetchCatalog = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/products`); // Tüm esnaf ürünlerini getirir
      const data = await res.json();
      setCatalog(Array.isArray(data) ? data : []);
    } catch(e) {} finally { setLoading(false); }
  };

  const fetchChatList = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/messages/list/${user?._id}`);
      const data = await res.json();
      setChatList(Array.isArray(data) ? data : []);
    } catch(e) {} finally { setLoading(false); }
  };

  const handleCreateRequest = async () => {
    if(!newReq.partName || !newReq.vehicleBrand) return Alert.alert('Eksik', 'Lütfen parça ve marka verilerini mühürleyin.');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/requests`, {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({ ...newReq, customerId: user?._id })
      });
      if(res.ok) { 
          setShowAddForm(false); 
          setNewReq({partName:'', vehicleBrand:'', description:''}); 
          fetchRequests(); 
          Alert.alert('Mühürlendi', 'Talebiniz tüm esnafların "YENİ TALEPLER" ekranına düşmüştür.');
      }
    } catch(e) {} finally { setLoading(false); }
  };

  const filteredCatalog = catalog.filter(p => 
     p.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     p.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (chatOpen) return <ChatScreen user={user} receiverId={receiverId} receiverName={receiverName} onBack={() => setChatOpen(false)} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View><Text style={styles.logoText}>OTO<Text style={{color: COLORS.primary}}>PARCA</Text></Text><Text style={styles.hSub}>MÜŞTERİ PANELİ</Text></View>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}><Text style={styles.logoutText}>GÜVENLİ ÇIKIŞ</Text></TouchableOpacity>
      </View>

      <View style={styles.body}>
        {loading ? <ActivityIndicator color={COLORS.primary} style={{marginTop:50}} /> : (
          <>
            {activeTab === 'MY_REQUESTS' && (
              <View style={{flex:1}}>
                {showAddForm ? (
                  <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.formNav}><Text style={styles.formTitle}>Kurumsal Parça Talebi</Text><TouchableOpacity onPress={()=>setShowAddForm(false)}><Text style={{color:'#ff4444', fontWeight:'bold'}}>İPTAL</Text></TouchableOpacity></View>
                    <View style={styles.formSection}>
                      <Text style={styles.sectionLabel}>● ARADIĞINIZ PARÇA NEDİR?</Text>
                      <TextInput style={styles.proInput} placeholder="Parça Adı (Örn: Sol Arka Amortisör)" placeholderTextColor="#444" value={newReq.partName} onChangeText={t=>setNewReq({...newReq, partName:t})} />
                    </View>
                    <View style={styles.formSection}>
                      <Text style={styles.sectionLabel}>● ARAÇ MARKA VE MODELİ</Text>
                      <TextInput style={styles.proInput} placeholder="Örn: Renault Megane 4 (2018)" placeholderTextColor="#444" value={newReq.vehicleBrand} onChangeText={t=>setNewReq({...newReq, vehicleBrand:t})} />
                    </View>
                    <View style={styles.formSection}>
                      <Text style={styles.sectionLabel}>● DETAYLI AÇIKLAMA</Text>
                      <TextInput style={[styles.proInput, {height:120, textAlignVertical:'top'}]} multiline placeholder="Hangi varyant? Orijinal mi olsun? Bir şase numarası var mı? Buraya mühürleyin..." placeholderTextColor="#444" value={newReq.description} onChangeText={t=>setNewReq({...newReq, description:t})} />
                    </View>
                    <TouchableOpacity style={styles.commitBtn} onPress={handleCreateRequest}><Text style={styles.btnText}>TALEBİ TÜM ESNAFLARA MÜHÜRLE</Text></TouchableOpacity>
                  </ScrollView>
                ) : (
                  <>
                    <TouchableOpacity style={styles.addTrigger} onPress={()=>setShowAddForm(true)}><Text style={styles.btnText}>➕ YENİ PARÇA TALEBİ OLUŞTUR</Text></TouchableOpacity>
                    <FlatList data={requests} keyExtractor={item=>item._id} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={()=>fetchRequests(true)}/>} renderItem={({item})=>(
                      <View style={styles.card}>
                        <View style={styles.cardHeader}><Text style={styles.cardTitle}>{item.partName}</Text><Text style={styles.brandTag}>{item.vehicleBrand}</Text></View>
                        <Text style={styles.cardDesc}>{item.description}</Text>
                        <Text style={{color:'#666', fontSize:10, marginTop:10}}>📌 Durum: Esnaflar teklif verebilir.</Text>
                      </View>
                    )} ListEmptyComponent={<Text style={styles.emptyText}>Henüz bir parça talebi mühürlemediniz.</Text>} />
                  </>
                )}
              </View>
            )}

            {activeTab === 'CATALOG' && (
              <View style={{flex:1}}>
                <TextInput style={styles.searchBar} placeholder="Katalogda parça veya marka ara..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} />
                <FlatList data={filteredCatalog} keyExtractor={item=>item._id} renderItem={({item})=>(
                  <View style={styles.productCard}>
                    <View style={{flexDirection:'row', gap:15}}>
                      {item.image && <Image source={{uri: item.image}} style={styles.prodImage} />}
                      <View style={{flex:1}}>
                        <View style={{flexDirection:'row', justifyContent:'space-between'}}><Text style={styles.prodTitle}>{item.name}</Text><Text style={styles.prodPrice}>{item.price} TL</Text></View>
                        <Text style={styles.prodSub}>{item.brand} {item.model} ({item.year})</Text>
                        <Text style={styles.prodDesc} numberOfLines={2}>{item.description}</Text>
                        <TouchableOpacity style={styles.askBtn} onPress={()=>{ setReceiverId(item.dealerId); setReceiverName('MAĞAZA YETKİLİSİ'); setChatOpen(true); }}><Text style={styles.miniBtnText}>💬 ESNAFA SOR / SATIN AL</Text></TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )} ListEmptyComponent={<Text style={styles.emptyText}>Henüz kurumsal parça yüklenmemiş.</Text>} />
              </View>
            )}

            {activeTab === 'OFFERS' && (
              <FlatList data={chatList} keyExtractor={item=>item._id} renderItem={({item})=>(
                <TouchableOpacity style={styles.chatCard} onPress={()=>{ setReceiverId(item._id); setReceiverName(item.name); setChatOpen(true); }}>
                  <View style={{flex:1}}><Text style={styles.userName}>{item.name}</Text><Text style={styles.userSub}>Canlı Teklif Görüşmesi</Text></View>
                  <Text style={{fontSize:22}}>💬</Text>
                </TouchableOpacity>
              )} ListEmptyComponent={<Text style={styles.emptyText}>Esnaflardan gelen yeni bir mesaj yok.</Text>} />
            )}

            {activeTab === 'SUPPORT' && (
              <View style={styles.supportBox}>
                <Text style={{fontSize:55}}>🛡️</Text>
                <Text style={styles.mBold}>Sistem Destek Merkezi</Text>
                <Text style={styles.lockDesc}>Tüm ödeme ve teknik sorunlarınız için Admin ile iletişime geçin.</Text>
                <TouchableOpacity style={[styles.commitBtn, {marginTop:20, width:'80%'}]} onPress={()=>{ setReceiverId('ADMIN'); setReceiverName('SİSTEM DESTEK'); setChatOpen(true); }}><Text style={styles.btnText}>💬 DESTEĞE BAĞLAN</Text></TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      <View style={styles.bottomNav}>
        {[
          {id:'MY_REQUESTS', label:'TALEPLERİM', icon:'📦'},
          {id:'CATALOG', label:'KATALOG', icon:'🔍'},
          {id:'OFFERS', label:'MESAJLAR', icon:'💬'},
          {id:'SUPPORT', label:'DESTEK', icon:'🛡️'}
        ].map(tab => (
          <TouchableOpacity key={tab.id} style={styles.navItem} onPress={() => setActiveTab(tab.id)}>
            <Text style={{fontSize:18, opacity: activeTab === tab.id ? 1 : 0.4}}>{tab.icon}</Text>
            <Text style={[styles.navText, {color: activeTab === tab.id ? COLORS.primary : '#666'}]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D14' },
  header: { padding: 25, paddingTop: 40, backgroundColor: COLORS.card, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  logoText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  hSub: { color: COLORS.primary, fontSize: 8, fontWeight: 'bold', marginTop:-5 },
  logoutBtn: { backgroundColor:'#1F1F2C', padding:8, borderRadius:10 },
  logoutText: { color:'#FF4444', fontSize:9, fontWeight:'bold' },
  body: { flex: 1, padding: 15 },
  bottomNav: { flexDirection: 'row', backgroundColor: COLORS.card, paddingVertical: 15, borderTopWidth:1, borderTopColor: COLORS.border, paddingBottom: 25 },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { fontSize: 8, fontWeight: 'bold', marginTop: 4 },
  addTrigger: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  formNav: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  formTitle: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  formSection: { marginBottom:20 },
  sectionLabel: { color: COLORS.primary, fontSize: 10, fontWeight: 'bold', marginBottom:10 },
  proInput: { backgroundColor: '#000', color: '#FFF', padding: 16, borderRadius: 15, fontSize:14 },
  commitBtn: { backgroundColor: COLORS.primary, padding: 20, borderRadius: 15, alignItems:'center' },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  searchBar: { backgroundColor: COLORS.card, color: '#FFF', padding: 16, borderRadius: 15, marginBottom: 15, borderWidth: 1, borderColor: '#222' },
  card: { backgroundColor: COLORS.card, padding: 22, borderRadius: 24, marginBottom: 15, borderBottomWidth: 3, borderBottomColor: COLORS.primaryDim },
  cardHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  cardTitle: { color: COLORS.primary, fontWeight: 'bold', fontSize: 16 },
  brandTag: { backgroundColor:'#333', paddingVertical:4, paddingHorizontal:10, borderRadius:8, fontSize:9, color:'#FFF', fontWeight:'bold' },
  cardDesc: { color: '#AAA', fontSize: 13, lineHeight:20 },
  productCard: { backgroundColor: COLORS.card, padding: 16, borderRadius: 22, marginBottom: 12, borderWidth:1, borderColor:'#222' },
  prodImage: { width:80, height:80, borderRadius:14, backgroundColor:'#000' },
  prodTitle: { color:'#FFF', fontWeight:'bold', fontSize:14 },
  prodPrice: { color: COLORS.primary, fontWeight:'bold', fontSize:15 },
  prodSub: { color: '#666', fontSize: 10, marginTop:2 },
  prodDesc: { color:'#999', fontSize:11, marginTop:8, opacity:0.8 },
  askBtn: { backgroundColor:'#1F1F2C', padding:10, borderRadius:10, marginTop:10, alignItems:'center' },
  miniBtnText: { color:'#FFF', fontSize:9, fontWeight:'bold' },
  chatCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 20, marginBottom: 12, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:'#222' },
  userName: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  userSub: { color: COLORS.primary, fontSize: 11, marginTop: 4 },
  supportBox: { flex:1, justifyContent:'center', alignItems:'center', padding:30 },
  mBold: { color:'#FFF', fontSize:18, fontWeight:'bold' },
  lockDesc: { color:'#666', textAlign:'center', marginTop:10, fontSize:12, lineHeight: 18 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50, fontSize: 13 }
});
