import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert, TextInput, ScrollView, RefreshControl, Modal } from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';
import ChatScreen from './ChatScreen';

export default function AdminDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('USERS'); 
  const [subTab, setSubTab] = useState('SUBS'); 
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [supportChats, setSupportChats] = useState([]); // Destek talepleri listesi
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('ALL'); 

  const [chatOpen, setChatOpen] = useState(false);
  const [receiverId, setReceiverId] = useState(null);
  const [receiverName, setReceiverName] = useState('');

  const [selectedUser, setSelectedUser] = useState(null);
  const [addAdminModal, setAddAdminModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name:'', phone:'', password:'' });

  const [configs, setConfigs] = useState({
      MONTHLY_FEE: '0', COMMISSION_RATE: '10', 
      BANK_NAME: '', IBAN_NO: '',
      ACTIVE_GATEWAY: 'IYZICO',
      IYZICO_API_KEY: '', IYZICO_SECRET: '',
      PAYTR_ID: '', PAYTR_KEY: '', PAYTR_SALT: ''
  });

  useEffect(() => {
    if(activeTab === 'USERS') fetchUsers();
    else if(activeTab === 'PAYMENTS') {
        if(subTab === 'SUBS') fetchPayments();
        else fetchOrders();
    }
    else if(activeTab === 'MESSAGES') fetchSupportChats();
    else if(activeTab === 'SETTINGS') fetchConfigs();
  }, [activeTab, subTab]);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/configs`);
      const data = await res.json();
      if(Array.isArray(data)) {
        let newSet = {...configs};
        data.forEach(c => { if(newSet.hasOwnProperty(c.key)) newSet[c.key] = c.value; });
        setConfigs(newSet);
      }
    } catch(e) {} finally { setLoading(false); }
  };

  const handleSaveAllConfigs = async () => {
    setLoading(true);
    try {
        for(const key of Object.keys(configs)) {
            await fetch(`${API_URL}/admin/configs`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key, value: configs[key] })
            });
        }
        Alert.alert('Mühürlendi', 'Başarıyla kaydedildi.');
    } catch(e) { Alert.alert('Hata', 'Kaydedilemedi.'); }
    finally { setLoading(false); }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/users`);
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (e) {} finally { setLoading(false); }
  };

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/admin/payments`);
      const data = await res.json();
      setPayments(Array.isArray(data) ? data : []);
    } catch (e) {} finally { setLoading(false); }
  };

  const fetchSupportChats = async () => {
      setLoading(true);
      try {
          // Destek birimine (ADMIN) mesaj atan esnafları getir
          const res = await fetch(`${API_URL}/messages/support-list`);
          const data = await res.json();
          setSupportChats(Array.isArray(data) ? data : []);
      } catch(e) {} finally { setLoading(false); }
  };

  const fetchOrders = async () => {
      setLoading(true);
      try {
          const res = await fetch(`${API_URL}/requests`); 
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
      } catch(e) {} finally { setLoading(false); }
  };

  const approvePayment = async (payId) => {
    try {
      const res = await fetch(`${API_URL}/admin/payments/${payId}/approve`, { method: 'POST' });
      if(res.ok) { fetchPayments(); fetchUsers(); Alert.alert('Onaylandı', 'Dükkan aktif edildi.'); }
    } catch(e) {}
  };

  const toggleUserStatus = async (userId, currentStatus) => {
      try {
          const res = await fetch(`${API_URL}/admin/users/${userId}/toggle-status`, {
              method: 'POST', headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ isSubscriptionActive: !currentStatus })
          });
          if(res.ok) {
              Alert.alert('Mühürlendi', currentStatus ? 'Engellendi.' : 'Aktif Edildi.');
              fetchUsers(); setSelectedUser(null);
          }
      } catch(e) {}
  };

  const manualExtendUser = async (userId) => {
      try {
          const res = await fetch(`${API_URL}/admin/users/${userId}/extend`, { method: 'POST' });
          if(res.ok) {
              Alert.alert('Başarılı', '30 Gün Hediye Süre Eklendi.');
              fetchUsers(); setSelectedUser(null);
          }
      } catch(e) {}
  };

  const filteredUsers = users.filter(u => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = u.name?.toLowerCase().includes(q) || u.phone?.includes(q) || u.vkn?.includes(q);
      if(filter === 'ALL') return matchesSearch;
      if(filter === 'MUSTERI') return matchesSearch && u.role === 'CUSTOMER';
      if(filter === 'ESNAF') return matchesSearch && u.role === 'DEALER';
      return matchesSearch;
  });

  if (chatOpen) return <ChatScreen user={user} receiverId={receiverId} receiverName={receiverName} onBack={() => setChatOpen(false)} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logoText}>OTO<Text style={{color: COLORS.primary}}>PARCA</Text></Text>
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}><Text style={styles.logoutText}>Güvenli Çıkış</Text></TouchableOpacity>
      </View>

      <View style={styles.tabsContainer}>
        {[
            {id:'USERS', label:'Üyeler', icon:'👥'},
            {id:'PAYMENTS', label:'Ödemeler', icon:'💰'},
            {id:'MESSAGES', label:'Destek', icon:'💬'},
            {id:'SETTINGS', label:'Ayarlar', icon:'⚙️'}
        ].map((tab) => (
          <TouchableOpacity key={tab.id} style={[styles.tab, activeTab === tab.id && styles.tabActive]} onPress={() => setActiveTab(tab.id)}>
              <Text style={{fontSize:22, marginBottom:5, opacity: activeTab === tab.id ? 1 : 0.4}}>{tab.icon}</Text>
              <Text style={[styles.tabText, activeTab === tab.id && {color: COLORS.primary}]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.body}>
        {loading ? <ActivityIndicator color={COLORS.primary} style={{marginTop: 50}} /> : (
          <>
            {activeTab === 'USERS' && (
              <View style={{flex:1}}>
                <View style={styles.searchBox}><TextInput style={styles.searchInput} placeholder="İsim, VKN, TC Sorgula..." placeholderTextColor="#666" value={searchQuery} onChangeText={setSearchQuery} /></View>
                <View style={styles.filterRow}>
                    <TouchableOpacity style={[styles.filterBtn, filter === 'ALL' && styles.filterBtnActive]} onPress={()=>setFilter('ALL')}><Text style={styles.filterText}>Hepsi</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.filterBtn, filter === 'MUSTERI' && styles.filterBtnActive]} onPress={()=>setFilter('MUSTERI')}><Text style={styles.filterText}>Müşteri</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.filterBtn, filter === 'ESNAF' && styles.filterBtnActive]} onPress={()=>setFilter('ESNAF')}><Text style={styles.filterText}>Esnaf</Text></TouchableOpacity>
                </View>
                <FlatList data={filteredUsers} keyExtractor={item => item._id} renderItem={({item}) => (
                  <View style={styles.userCard}>
                    <View style={{flex:1}}><Text style={styles.userName}>{item.name}</Text><Text style={[styles.userSub, item.isSubscriptionActive ? {color:'#2ECC71'} : {color:'#FF4444'}]}>{item.isSubscriptionActive ? '● AKTİF' : '● ENGELİ'} | {item.role === 'DEALER' ? 'Esnaf' : 'Müşteri'}</Text></View>
                    <TouchableOpacity style={styles.inceleBtn} onPress={()=>setSelectedUser(item)}><Text style={styles.inceleText}>İNCELE</Text></TouchableOpacity>
                  </View>
                )} />
              </View>
            )}

            {activeTab === 'PAYMENTS' && (
              <View style={{flex:1}}>
                <View style={styles.subTabRow}>
                    <TouchableOpacity style={[styles.subTabBtn, subTab === 'SUBS' && styles.subTabActive]} onPress={()=>setSubTab('SUBS')}><Text style={styles.subTabText}>ABONELİKLER</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.subTabBtn, subTab === 'PAYOUTS' && styles.subTabActive]} onPress={()=>setSubTab('PAYOUTS')}><Text style={styles.subTabText}>HAKEDİŞLER</Text></TouchableOpacity>
                </View>
                <FlatList data={subTab === 'SUBS' ? payments : orders} keyExtractor={item=>item._id} renderItem={({item})=>(
                    <View style={styles.userCard}>
                        <View style={{flex:1}}>
                            <Text style={styles.userName}>{item.dealerName || item.dealerId?.name || 'Abonelik Talebi'}</Text>
                            <Text style={styles.userSub}>{item.amount || '0'} TL | {item.status}</Text>
                        </View>
                        {item.status === 'PENDING' && <TouchableOpacity style={styles.approveBtn} onPress={()=>approvePayment(item._id)}><Text style={styles.inceleText}>ONAYLA</Text></TouchableOpacity>}
                    </View>
                )} />
              </View>
            )}

            {activeTab === 'MESSAGES' && (
                <FlatList data={supportChats} keyExtractor={item=>item._id} renderItem={({item})=>(
                    <TouchableOpacity style={styles.userCard} onPress={()=>{ setReceiverId(item._id); setReceiverName(item.name); setChatOpen(true); }}>
                        <View style={{flex:1}}>
                            <Text style={styles.userName}>{item.name}</Text>
                            <Text style={styles.userSub}>WhatsApp Destek Talebi Açık</Text>
                        </View>
                        <Text style={{fontSize:24}}>💬</Text>
                    </TouchableOpacity>
                )} ListEmptyComponent={<Text style={styles.emptyText}>Henüz bir destek talebi bulunmuyor.</Text>} />
            )}

            {activeTab === 'SETTINGS' && (
                <ScrollView showsVerticalScrollIndicator={false}>
                    <Text style={styles.sectionTitle}>⚙️ MALİ YAPILANDIRMA</Text>
                    <View style={styles.configCard}>
                        <Text style={styles.inputLabel}>Bedel (TL):</Text><TextInput style={styles.input} value={configs.MONTHLY_FEE} onChangeText={t=>setConfigs({...configs, MONTHLY_FEE:t})} keyboardType="numeric" />
                        <Text style={[styles.inputLabel, {marginTop:15}]}>Platform IBAN:</Text><TextInput style={styles.input} value={configs.IBAN_NO} onChangeText={t=>setConfigs({...configs, IBAN_NO:t})} />
                    </View>
                    <Text style={styles.sectionTitle}>💳 API GATEWAY</Text>
                    <View style={styles.configCard}>
                        <View style={styles.gatewayRow}>
                            <TouchableOpacity style={[styles.gateBtn, configs.ACTIVE_GATEWAY === 'IYZICO' && styles.gateActive]} onPress={()=>setConfigs({...configs, ACTIVE_GATEWAY:'IYZICO'})}><Text style={styles.gateText}>IYZICO</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.gateBtn, configs.ACTIVE_GATEWAY === 'PAYTR' && styles.gateActive]} onPress={()=>setConfigs({...configs, ACTIVE_GATEWAY:'PAYTR'})}><Text style={styles.gateText}>PAYTR</Text></TouchableOpacity>
                        </View>
                        {configs.ACTIVE_GATEWAY === 'IYZICO' ? (
                            <View style={{marginTop:15}}>
                                <Text style={styles.inputLabel}>API Key:</Text><TextInput style={styles.input} value={configs.IYZICO_API_KEY} onChangeText={v=>setConfigs({...configs, IYZICO_API_KEY:v})}/>
                                <Text style={[styles.inputLabel, {marginTop:10}]}>Secret Key:</Text><TextInput style={styles.input} value={configs.IYZICO_SECRET} onChangeText={v=>setConfigs({...configs, IYZICO_SECRET:v})} secureTextEntry/>
                            </View>
                        ) : (
                            <View style={{marginTop:15}}>
                                <Text style={styles.inputLabel}>Mağaza No:</Text><TextInput style={styles.input} value={configs.PAYTR_ID} onChangeText={v=>setConfigs({...configs, PAYTR_ID:v})}/>
                                <Text style={[styles.inputLabel, {marginTop:10}]}>API Key:</Text><TextInput style={styles.input} value={configs.PAYTR_KEY} onChangeText={v=>setConfigs({...configs, PAYTR_KEY:v})} secureTextEntry/>
                                <Text style={[styles.inputLabel, {marginTop:10}]}>API Salt:</Text><TextInput style={styles.input} value={configs.PAYTR_SALT} onChangeText={v=>setConfigs({...configs, PAYTR_SALT:v})} secureTextEntry/>
                            </View>
                        )}
                        <TouchableOpacity style={styles.mainSaveBtn} onPress={handleSaveAllConfigs}><Text style={styles.mainSaveText}>HER ŞEYİ MÜHÜRLE</Text></TouchableOpacity>
                    </View>
                </ScrollView>
            )}
          </>
        )}
      </View>

      <Modal visible={!!selectedUser} transparent animationType="fade">
          <View style={styles.mBg}><View style={styles.mCard}>
              <Text style={styles.mBold}>{selectedUser?.name}</Text>
              <Text style={{color: COLORS.primary, marginBottom:15}}>{selectedUser?.role}</Text>
              <View style={styles.mLine}><Text style={styles.mLabel}>Tel:</Text><Text style={styles.mVal}>{selectedUser?.phone}</Text></View>
              <View style={styles.mLine}><Text style={styles.mLabel}>VKN:</Text><Text style={styles.mVal}>{selectedUser?.vkn || '-'}</Text></View>
              <TouchableOpacity style={[styles.actionBtn, {backgroundColor: selectedUser?.isSubscriptionActive ? '#FF4444' : '#2ECC71', marginTop:20}]} onPress={()=>toggleUserStatus(selectedUser._id, selectedUser.isSubscriptionActive)}>
                  <Text style={{color:'#FFF', fontWeight:'bold'}}>{selectedUser?.isSubscriptionActive ? '🚫 ÜYEYİ ENGELLE' : '✅ ÜYELİĞİ HEMEN AKTİF ET'}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={()=>setSelectedUser(null)} style={styles.mClose}><Text style={{color:'#FFF', fontWeight:'bold'}}>KAPAT</Text></TouchableOpacity>
          </View></View>
      </Modal>

      <Modal visible={addAdminModal} transparent animationType="slide">
          <View style={styles.mBg}><View style={styles.mCard}>
              <Text style={styles.mHeader}>Yeni Admin Yetkilendir</Text>
              <TextInput style={styles.input} placeholder="Ad Soyad" placeholderTextColor="#666" value={newAdmin.name} onChangeText={t=>setNewAdmin({...newAdmin, name:t})} />
              <TextInput style={[styles.input, {marginTop:10}]} placeholder="Telefon No" placeholderTextColor="#666" value={newAdmin.phone} onChangeText={t=>setNewAdmin({...newAdmin, phone:t})} keyboardType="phone-pad" />
              <TextInput style={[styles.input, {marginTop:10}]} placeholder="Giriş Şifresi" placeholderTextColor="#666" value={newAdmin.password} onChangeText={t=>setNewAdmin({...newAdmin, password:t})} secureTextEntry />
              <TouchableOpacity style={styles.mainSaveBtn} onPress={()=>Alert.alert('Tamam','Yetki verildi.')}><Text style={styles.mainSaveText}>YETKİYİ MÜHÜRLE</Text></TouchableOpacity>
              <TouchableOpacity onPress={()=>setAddAdminModal(false)} style={{marginTop:15, alignItems:'center'}}><Text style={{color:'#666', fontWeight:'bold'}}>İptal Et</Text></TouchableOpacity>
          </View></View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#12121A' },
  header: { padding: 25, paddingTop: 40, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoText: { color: '#FFF', fontSize: 26, fontWeight: '900' },
  logoutBtn: { backgroundColor: '#1F1F2C', padding: 12, borderRadius: 15 },
  logoutText: { color: '#FF4444', fontWeight: 'bold', fontSize: 11 },
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#1F1F2C' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 15 },
  tabActive: { borderBottomWidth: 3, borderBottomColor: COLORS.primary },
  tabText: { color: '#666', fontSize: 10, fontWeight: 'bold' },
  body: { flex: 1, padding: 15 },
  searchBox: { backgroundColor: '#000', padding: 15, borderRadius: 15, marginBottom: 15 },
  searchInput: { color: '#FFF' },
  filterRow: { flexDirection: 'row', marginBottom: 20 },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 15, borderRadius: 12, backgroundColor: '#1F1F2C', marginRight: 10 },
  filterBtnActive: { backgroundColor: COLORS.primary },
  filterText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  userCard: { backgroundColor: '#1F1F2C', padding: 18, borderRadius: 22, marginBottom: 15, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#2A2A3C' },
  userName: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  userSub: { color: '#666', fontSize: 11, marginTop: 4 },
  inceleBtn: { backgroundColor: '#2A2A3C', paddingVertical: 10, paddingHorizontal: 15, borderRadius: 12 },
  inceleText: { color: '#FFF', fontWeight: 'bold', fontSize: 10 },
  subTabRow: { flexDirection: 'row', backgroundColor: '#000', borderRadius: 15, padding: 5, marginBottom: 20 },
  subTabBtn: { flex: 1, padding: 10, alignItems: 'center', borderRadius: 12 },
  subTabActive: { backgroundColor: '#1F1F2C' },
  subTabText: { color: '#FFF', fontSize: 9, fontWeight: 'bold' },
  sectionTitle: { color: COLORS.primary, fontSize: 11, fontWeight: 'bold', marginTop: 10, marginBottom: 15 },
  configCard: { backgroundColor: '#1F1F2C', padding: 20, borderRadius: 20, marginBottom: 15 },
  gatewayRow: { flexDirection:'row', backgroundColor:'#000', padding:5, borderRadius:12 },
  gateBtn: { flex:1, padding:10, alignItems:'center', borderRadius:10 },
  gateActive: { backgroundColor: COLORS.primary },
  gateText: { color:'#FFF', fontWeight:'bold', fontSize:11 },
  inputLabel: { color: '#666', fontSize: 10, marginBottom: 5 },
  input: { backgroundColor: '#000', color: '#FFF', padding: 15, borderRadius: 15 },
  mainSaveBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center' },
  mainSaveText: { color: '#FFF', fontWeight: 'bold', fontSize: 12 },
  actionBtn: { padding: 16, borderRadius: 15, alignItems: 'center' },
  approveBtn: { backgroundColor: COLORS.primaryDim, paddingVertical: 12, paddingHorizontal: 15, borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary },
  mBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.92)', justifyContent: 'center', alignItems: 'center' },
  mCard: { width: '85%', backgroundColor: '#1F1F2C', padding: 25, borderRadius: 30, borderWidth: 1, borderColor: COLORS.primary },
  mHeader: { color: '#666', fontSize: 10, fontWeight: 'bold', marginBottom: 10 },
  mBold: { color:'#FFF', fontSize: 22, fontWeight:'bold' },
  mLine: { flexDirection:'row', justifyContent:'space-between', paddingVertical:10, borderBottomWidth:1, borderBottomColor:'#2A2A3C' },
  mLabel: { color:'#666', fontSize:12 },
  mVal: { color:'#FFF', fontSize:12, fontWeight:'bold' },
  mClose: { backgroundColor: '#333', padding:15, borderRadius:15, alignItems:'center', marginTop:20 },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 50, fontSize: 13 }
});
