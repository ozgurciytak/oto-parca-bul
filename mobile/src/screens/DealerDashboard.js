import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, Alert, TextInput, ScrollView, RefreshControl, Modal, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker'; 
import { COLORS } from '../theme';
import { API_URL } from '../config';
import ChatScreen from './ChatScreen';

export default function DealerDashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('QUESTIONS'); 
  const [questions, setQuestions] = useState([]);
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [chatList, setChatList] = useState([]); 
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [chatOpen, setChatOpen] = useState(false);
  const [receiverId, setReceiverId] = useState(null);
  const [receiverName, setReceiverName] = useState('');
  
  const [renewModal, setRenewModal] = useState(false);
  const [paymentType, setPaymentType] = useState(null); 
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
      name:'', brand:'', model:'', year:'', color:'', description:'', price:'', stock:'', image: null 
  });

  const [cardInfo, setCardInfo] = useState({ holder:'', number:'', expiry:'', cvv:'' });

  const [profileForm, setProfileForm] = useState({
      name: user?.name || '', authorizedPerson: user?.authorizedPerson || '',
      phone: user?.phone || '', vkn: user?.vkn || '',
      taxOffice: user?.taxOffice || '', address: user?.address || '',
      bankName: user?.bankName || '', accHolder: user?.accHolder || '',
      iban: user?.iban || ''
  });

  const [configs, setConfigs] = useState({ BANK_NAME: '...', IBAN_NO: '...', MONTHLY_FEE: '0' });

  useEffect(() => {
    fetchConfigs();
    if(user?.isSubscriptionActive) {
        if(activeTab === 'QUESTIONS') fetchQuestions();
        else if(activeTab === 'SALES') fetchSales();
        else if(activeTab === 'INVENTORY') fetchInventory();
        else if(activeTab === 'MESSAGES') fetchChatList();
    }
  }, [activeTab]);

  const fetchConfigs = async () => {
    try {
      const res = await fetch(`${API_URL}/admin/configs`);
      const data = await res.json();
      if(Array.isArray(data)) {
          let newSet = {...configs};
          data.forEach(c => { if(newSet.hasOwnProperty(c.key)) newSet[c.key] = c.value; });
          setConfigs(newSet);
      }
    } catch(e) {}
  };

  const fetchQuestions = async (isPull = false) => {
    if(!isPull) setLoading(true);
    try {
      const res = await fetch(`${API_URL}/requests`); 
      const data = await res.json();
      setQuestions(Array.isArray(data) ? data : []);
    } catch (e) {} finally { setLoading(false); setRefreshing(false); }
  };

  const fetchInventory = async () => {
      setLoading(true);
      try {
          const res = await fetch(`${API_URL}/products/dealer/${user?._id}`);
          const data = await res.json();
          setInventory(Array.isArray(data) ? data : []);
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

  const pickImage = async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') return Alert.alert('İzin', 'Gerekli.');
      let result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect:[4,3], quality:0.5, base64: true
      });
      if (!result.canceled) setNewProduct({ ...newProduct, image: `data:image/jpeg;base64,${result.assets[0].base64}` });
  };

  const handleAddProduct = async () => {
      if(!newProduct.name || !newProduct.price || !newProduct.stock) return Alert.alert('Hata', 'Zorunlu alanları mühürleyin.');
      setLoading(true);
      try {
          const res = await fetch(`${API_URL}/products`, {
              method: 'POST', headers: {'Content-Type':'application/json'},
              body: JSON.stringify({ ...newProduct, dealerId: user?._id })
          });
          if(res.ok) { setShowAddForm(false); setNewProduct({name:'', brand:'', model:'', year:'', color:'', description:'', price:'', stock:'', image:null}); fetchInventory(); }
      } catch(e) {} finally { setLoading(false); }
  };

  // 🔥 ÖDEME BİLDİRİMİ TEŞHİS TERMİNALİ v90.2 🛡️🕵️‍♂️
  const handleReportEFT = async () => {
    if(!user?._id) return Alert.alert('Kimlik Hatası', 'Giriş bilgileriniz eksik.');
    setLoading(true);
    const targetUrl = `${API_URL}/admin/payments`; 
    try {
        const rawFee = configs.MONTHLY_FEE || '0';
        const amountValue = parseFloat(rawFee.toString().replace(/[^0-9.]/g, '')) || 0;
        
        const res = await fetch(targetUrl, {
            method: 'POST', headers: {'Content-Type':'application/json'},
            body: JSON.stringify({
                dealerId: user?._id, dealerName: user?.name, amount: amountValue,
                type: 'SUBSCRIPTION', status: 'PENDING'
            })
        });

        if(res.ok) { 
            Alert.alert('Mühürlendi', 'Ödeme bildiriminiz sisteme işlendi. Admin onayını bekleyin.'); 
            setRenewModal(false); 
        } else {
            const errStatus = res.status;
            Alert.alert('Sunucu Reddi', `Adres: ${targetUrl}\nHata Kodu: ${errStatus}\nLütfen Admin'e bildirin.`);
        }
    } catch(e) { 
        Alert.alert('Sinyal Hatası', `Sunucuya ulaşılamadı!\nAdres: ${targetUrl}\nLütfen interneti veya sunucu durumunu kontrol edin.`); 
    } finally { setLoading(false); }
  };

  const handlePayWithCard = async () => {
      if(!cardInfo.number || !cardInfo.cvv) return Alert.alert('Hata', 'Kart bilgileri eksik.');
      setLoading(true);
      const targetUrl = `${API_URL}/admin/payments`;
      try {
          const amountValue = parseFloat(configs.MONTHLY_FEE.toString().replace(/[^0-9.]/g, '')) || 0;
          const res = await fetch(targetUrl, {
              method: 'POST', headers: {'Content-Type':'application/json'},
              body: JSON.stringify({
                  dealerId: user?._id, dealerName: user?.name, amount: amountValue,
                  type: 'SUBSCRIPTION', status: 'PAID',
                  cardLastFour: cardInfo.number.slice(-4)
              })
          });
          if(res.ok) { Alert.alert('BAŞARILI', 'Ödeme mühürlendi / aktif edildi.'); setRenewModal(false); }
          else { Alert.alert('Banka Reddi', `Adres: ${targetUrl}\nDurum: ${res.status}`); }
      } catch(e) { Alert.alert('Gateway Hatası', `Bankaya ulaşılamadı.\nAdres: ${targetUrl}`); } 
      finally { setLoading(false); }
  };

  const calculateDaysLeft = () => {
      if(!user?.subscriptionExpiresAt) return 0;
      const days = Math.ceil((new Date(user.subscriptionExpiresAt) - new Date()) / (1000 * 60 * 60 * 24));
      return days > 0 ? days : 0;
  };

  const renderRenewScreen = () => (
    <View style={styles.lockCard}>
        <Text style={{fontSize:55}}>🔐</Text>
        <Text style={styles.lockTitle}>Dükkan Planı Bitti</Text>
        <Text style={styles.lockDesc}>Devam etmek için ödeme methodunuzu mühürleyin.</Text>
        <View style={styles.payChoiceRow}>
            <TouchableOpacity style={[styles.payChoiceBtn, paymentType === 'CARD' && styles.payChoiceBtnActive]} onPress={()=>setPaymentType('CARD')}><Text style={styles.payEmoji}>💳</Text><Text style={styles.payChoiceText}>Kartla Hemen{"\n"}Aktif Et</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.payChoiceBtn, paymentType === 'EFT' && styles.payChoiceBtnActive]} onPress={()=>setPaymentType('EFT')}><Text style={styles.payEmoji}>🏦</Text><Text style={styles.payChoiceText}>Havale Bildir{"\n"}(Onay Beklet)</Text></TouchableOpacity>
        </View>
        {paymentType === 'CARD' && (
            <View style={styles.pDetailBox}>
                <Text style={styles.pDetailTitle}>🛡️ GÜVENLİ ÖDEME (SSL)</Text>
                <TextInput style={styles.fInput} placeholder="Ad Soyad" value={cardInfo.holder} onChangeText={t=>setCardInfo({...cardInfo, holder:t})} />
                <TextInput style={styles.fInput} placeholder="Kart No" keyboardType="numeric" maxLength={16} value={cardInfo.number} onChangeText={t=>setCardInfo({...cardInfo, number:t})} />
                <View style={{flexDirection:'row', gap:10, marginTop:10}}><TextInput style={[styles.fInput, {flex:1}]} placeholder="AA/YY" value={cardInfo.expiry} onChangeText={t=>setCardInfo({...cardInfo, expiry:t})} /><TextInput style={[styles.fInput, {flex:1}]} placeholder="CVV" keyboardType="numeric" maxLength={3} value={cardInfo.cvv} onChangeText={t=>setCardInfo({...cardInfo, cvv:t})} /></View>
                <TouchableOpacity style={styles.payBtn} onPress={handlePayWithCard}><Text style={styles.btnText}>{configs.MONTHLY_FEE} TL ÖDE VE AÇ</Text></TouchableOpacity>
            </View>
        )}
        {paymentType === 'EFT' && (
            <View style={styles.pDetailBox}>
                <Text style={styles.pDetailTitle}>🏦 BANKA BİLGİLERİ</Text>
                <Text style={styles.pDetailSub}>{configs.BANK_NAME}</Text>
                <Text style={styles.ibanText}>{configs.IBAN_NO}</Text>
                <TouchableOpacity style={[styles.payBtn, {backgroundColor:'#333'}]} onPress={handleReportEFT}><Text style={styles.btnText}>ÖDEME YAPTIM, BİLDİR</Text></TouchableOpacity>
            </View>
        )}
    </View>
  );

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/update-profile`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user?._id, ...profileForm })
      });
      if(res.ok) Alert.alert('Başarılı', 'Kurumsal veriler mühürlendi.');
    } catch(e) {} finally { setLoading(false); }
  };

  if(!user?.isSubscriptionActive) return <SafeAreaView style={[styles.container, {justifyContent:'center', padding:30, backgroundColor:COLORS.background}]}>{renderRenewScreen()}<TouchableOpacity onPress={onLogout} style={{marginTop:30, alignSelf:'center'}}><Text style={{color:'#ff4444', fontWeight:'bold'}}>GÜVENLİ ÇIKIŞ YAP</Text></TouchableOpacity></SafeAreaView>;
  if (chatOpen) return <ChatScreen user={user} receiverId={receiverId} receiverName={receiverName} onBack={() => setChatOpen(false)} />;

  return (
    <SafeAreaView style={styles.container}>
        <View style={styles.header}>
            <View><Text style={styles.logoText}>OTO<Text style={{color: COLORS.primary}}>PARCA</Text></Text><Text style={styles.hSub}>ESNAF PANELİ</Text></View>
            <View style={{alignItems:'flex-end'}}>
                <Text style={styles.hName}>{user?.name?.substring(0, 15)}</Text>
                <Text style={styles.daysText}>{calculateDaysLeft()} GÜN KALDI</Text>
                <TouchableOpacity onPress={()=>setRenewModal(true)}><Text style={{color:COLORS.primary, fontSize:9, fontWeight:'bold'}}>[ SÜREYİ UZAT ]</Text></TouchableOpacity>
            </View>
        </View>

        <View style={styles.content}>
            {loading ? <ActivityIndicator color={COLORS.primary} style={{marginTop: 50}} /> : (
                <>
                {activeTab === 'QUESTIONS' && <FlatList data={questions} keyExtractor={item=>item._id} renderItem={({item})=>(<View style={styles.card}><View style={styles.cardHeader}><Text style={styles.cardTitle}>{item.partName}</Text><Text style={styles.brandTag}>{item.vehicleBrand}</Text></View><Text style={styles.cardDesc}>{item.description}</Text><TouchableOpacity style={styles.actionBtn} onPress={() => { setReceiverId(item.customerId?._id); setReceiverName(item.customerId?.name); setChatOpen(true); }}><Text style={styles.actionText}>💬 WHATSAPP TEKLİFİ VER</Text></TouchableOpacity></View>)} />}
                {activeTab === 'INVENTORY' && (
                    <View style={{flex:1}}>
                        {showAddForm ? (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.formNav}><Text style={styles.formLabel}>Ürün Giriş Terminali</Text><TouchableOpacity onPress={()=>setShowAddForm(false)}><Text style={{color:'#ff4444', fontWeight:'bold'}}>İPTAL</Text></TouchableOpacity></View>
                                <TouchableOpacity style={styles.imageSelector} onPress={pickImage}>{newProduct.image ? <Image source={{uri: newProduct.image}} style={styles.formPreview} /> : <View style={{alignItems:'center'}}><Text style={{fontSize:40}}>📸</Text><Text style={{color:'#666', fontSize:10, marginTop:10}}>GÖRSEL YÜKLE</Text></View>}</TouchableOpacity>
                                <View style={styles.inputGroup}><Text style={styles.groupLabel}>ARAÇ BİLGİSİ</Text><View style={{flexDirection:'row', gap:10}}><TextInput style={[styles.proInput, {flex:1}]} placeholder="Marka" value={newProduct.brand} onChangeText={t=>setNewProduct({...newProduct, brand:t})} /><TextInput style={[styles.proInput, {flex:1}]} placeholder="Model" value={newProduct.model} onChangeText={t=>setNewProduct({...newProduct, model:t})} /><TextInput style={[styles.proInput, {flex:0.6}]} placeholder="Yıl" value={newProduct.year} onChangeText={t=>setNewProduct({...newProduct, year:t})} keyboardType="numeric"/></View></View>
                                <View style={styles.inputGroup}><Text style={styles.groupLabel}>PARÇA DETAYI</Text><TextInput style={styles.proInput} placeholder="Parça Adı" value={newProduct.name} onChangeText={t=>setNewProduct({...newProduct, name:t})} /><View style={{flexDirection:'row', gap:10, marginTop:10}}><TextInput style={[styles.proInput, {flex:1}]} placeholder="Fiyat (TL)" value={newProduct.price} onChangeText={t=>setNewProduct({...newProduct, price:t})} keyboardType="numeric"/><TextInput style={[styles.proInput, {flex:1}]} placeholder="Stok" value={newProduct.stock} onChangeText={t=>setNewProduct({...newProduct, stock:t})} keyboardType="numeric"/></View></View>
                                <View style={styles.inputGroup}><Text style={styles.groupLabel}>DETAYLI AÇIKLAMA</Text><TextInput style={[styles.proInput, {height:100, textAlignVertical:'top'}]} multiline placeholder="Açıklama mühürleyin..." value={newProduct.description} onChangeText={t=>setNewProduct({...newProduct, description:t})} /></View>
                                <TouchableOpacity style={styles.commitBtn} onPress={handleAddProduct}><Text style={styles.btnText}>ÜRÜNÜ YAYINLA</Text></TouchableOpacity>
                                <View style={{height:40}} />
                            </ScrollView>
                        ) : (
                            <View style={{flex:1}}><TouchableOpacity style={styles.addTrigger} onPress={()=>setShowAddForm(true)}><Text style={styles.btnText}>➕ YENİ ÜRÜN EKLE</Text></TouchableOpacity>
                            <FlatList data={inventory} keyExtractor={item=>item._id} renderItem={({item})=>(<View style={styles.card}><View style={{flexDirection:'row', gap:15}}>{item.image && <Image source={{uri: item.image}} style={styles.listThumb} />}<View style={{flex:1}}><View style={{flexDirection:'row', justifyContent:'space-between'}}><Text style={styles.cardTitle}>{item.name}</Text><Text style={styles.priceText}>{item.price} TL</Text></View><Text style={styles.userSubText}>{item.brand} {item.model} ({item.year})</Text></View></View></View>)} /></View>
                        )}
                    </View>
                )}
                {activeTab === 'MESSAGES' && <FlatList data={chatList} keyExtractor={item=>item._id} renderItem={({item})=>(<TouchableOpacity style={styles.chatCard} onPress={()=>{ setReceiverId(item._id); setReceiverName(item.name); setChatOpen(true); }}><View style={{flex:1}}><Text style={styles.userNameText}>{item.name}</Text><Text style={styles.userSubText}>Aktif Müşteri Sohbeti</Text></View><Text style={{fontSize:22}}>💬</Text></TouchableOpacity>)} />}
                {activeTab === 'PROFILE' && (
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.proLabel}>🏢 KURUMSAL KİMLİK</Text>
                        <View style={styles.proBox}>
                            <Text style={styles.fLabel}>Mağaza Adı</Text><TextInput style={styles.fInput} value={profileForm.name} onChangeText={t=>setProfileForm({...profileForm, name:t})} />
                            <Text style={styles.fLabel}>WhatsApp</Text><TextInput style={styles.fInput} value={profileForm.phone} onChangeText={t=>setProfileForm({...profileForm, phone:t})} />
                            <View style={{flexDirection:'row', gap:10, marginTop:10}}><View style={{flex:1}}><Text style={styles.fLabel}>VKN/TC</Text><TextInput style={styles.fInput} value={profileForm.vkn} onChangeText={t=>setProfileForm({...profileForm, vkn:t})} /></View><View style={{flex:1}}><Text style={styles.fLabel}>Vergi D.</Text><TextInput style={styles.fInput} value={profileForm.taxOffice} onChangeText={t=>setProfileForm({...profileForm, taxOffice:t})} /></View></View>
                        </View>
                        <Text style={[styles.proLabel, {marginTop:20}]}>🏦 BANKA HAKEDİŞ</Text>
                        <View style={styles.proBox}>
                            <Text style={styles.fLabel}>Banka</Text><TextInput style={styles.fInput} value={profileForm.bankName} onChangeText={t=>setProfileForm({...profileForm, bankName:t})} />
                            <Text style={styles.fLabel}>Hesap Sahibi</Text><TextInput style={styles.fInput} value={profileForm.accHolder} onChangeText={t=>setProfileForm({...profileForm, accHolder:t})} />
                            <Text style={styles.fLabel}>IBAN</Text><TextInput style={styles.fInput} value={profileForm.iban} onChangeText={t=>setProfileForm({...profileForm, iban:t})} />
                            <TouchableOpacity style={styles.commitBtn} onPress={handleSaveProfile}><Text style={styles.btnText}>BİLGİLERİ MÜHÜRLE</Text></TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={onLogout} style={{padding:25, alignItems:'center'}}><Text style={{color:'#ff4444', fontWeight:'bold'}}>GÜVENLİ ÇIKIŞ YAP</Text></TouchableOpacity>
                    </ScrollView>
                )}
                </>
            )}
        </View>

        <View style={styles.bottomNav}>
            {[{id:'QUESTIONS', label:'TALEPLER', icon:'🔍'}, {id:'INVENTORY', label:'ENVANTER', icon:'📦'}, {id:'MESSAGES', label:'MESAJLAR', icon:'💬'}, {id:'PROFILE', label:'HESABIM', icon:'👤'}].map(tab => (
                <TouchableOpacity key={tab.id} style={styles.navItem} onPress={() => setActiveTab(tab.id)}>
                    <Text style={{fontSize:18, opacity: activeTab === tab.id ? 1 : 0.4}}>{tab.icon}</Text>
                    <Text style={[styles.navText, {color: activeTab === tab.id ? COLORS.primary : '#666'}]}>{tab.label}</Text>
                </TouchableOpacity>
            ))}
        </View>

        <Modal visible={renewModal} transparent animationType="fade">
            <View style={styles.modalBg}><View style={styles.modalCard}>{renderRenewScreen()}<TouchableOpacity onPress={()=>setRenewModal(false)} style={{marginTop:20, alignSelf:'center'}}><Text style={{color:'#666', fontWeight:'bold'}}>KAPAT</Text></TouchableOpacity></View></View>
        </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { padding: 25, paddingTop: 40, backgroundColor: COLORS.card, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  logoText: { color: '#FFF', fontSize: 24, fontWeight: '900' },
  hSub: { color: COLORS.primary, fontSize: 8, fontWeight: 'bold' },
  hName: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  daysText: { color: '#ff4444', fontSize: 10, fontWeight: 'bold' },
  content: { flex: 1, padding: 15 },
  bottomNav: { flexDirection: 'row', backgroundColor: COLORS.card, paddingVertical: 15, borderTopWidth:1, borderTopColor: COLORS.border, paddingBottom: 25 },
  navItem: { flex: 1, alignItems: 'center' },
  navText: { fontSize: 8, fontWeight: 'bold', marginTop: 4 },
  card: { backgroundColor: COLORS.card, padding: 18, borderRadius: 24, marginBottom: 15, borderBottomWidth: 3, borderBottomColor: COLORS.primaryDim },
  cardHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:10 },
  cardTitle: { color: COLORS.primary, fontWeight: 'bold', fontSize: 15 },
  brandTag: { backgroundColor:'#333', paddingVertical:4, paddingHorizontal:10, borderRadius:8, fontSize:9, color:'#FFF', fontWeight:'bold' },
  cardDesc: { color: '#AAA', fontSize: 12, lineHeight:18 },
  actionBtn: { backgroundColor: COLORS.primaryDim, padding: 15, borderRadius: 14, alignItems: 'center', borderWidth:1, borderColor: COLORS.primary },
  actionText: { color: '#FFF', fontWeight: 'bold', fontSize: 11 },
  addTrigger: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginBottom: 20 },
  formNav: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  formLabel: { color: '#FFF', fontSize: 18, fontWeight: 'bold' },
  imageSelector: { width:'100%', height:160, backgroundColor:'#000', borderRadius:20, justifyContent:'center', alignItems:'center', marginBottom:20, borderWidth:1, borderColor:'#222', overflow:'hidden' },
  formPreview: { width:'100%', height:'100%' },
  inputGroup: { marginBottom:15 },
  groupLabel: { color: COLORS.primary, fontSize: 9, fontWeight: 'bold', marginBottom:8 },
  proInput: { backgroundColor: '#000', color: '#FFF', padding: 15, borderRadius: 15, fontSize:14 },
  commitBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 15, alignItems:'center', marginTop:15 },
  btnText: { color: '#FFF', fontWeight: 'bold' },
  listThumb: { width:65, height:65, borderRadius:12, backgroundColor:'#333' },
  priceText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  userSubText: { color: '#666', fontSize: 11 },
  chatCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 20, marginBottom: 12, flexDirection:'row', alignItems:'center', borderWidth:1, borderColor:'#222' },
  userNameText: { color: '#FFF', fontWeight: 'bold', fontSize: 15 },
  proLabel: { color: COLORS.primary, fontSize: 11, fontWeight: 'bold', marginBottom: 12 },
  proBox: { backgroundColor: COLORS.card, padding: 22, borderRadius: 24, borderWidth:1, borderColor: COLORS.border },
  fLabel: { color: '#666', fontSize: 10, marginTop: 12, marginBottom: 5 },
  fInput: { backgroundColor: '#000', color: '#FFF', padding: 15, borderRadius: 15, fontSize:14 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent:'center', alignItems:'center' },
  modalCard: { width: '90%', backgroundColor: COLORS.card, padding: 25, borderRadius: 30, borderWidth: 1, borderColor: COLORS.primary },
  lockCard: { alignItems:'center' },
  lockTitle: { color:'#FFF', fontSize:22, fontWeight:'bold', marginVertical:15 },
  lockDesc: { color:'#666', textAlign:'center', fontSize:12, lineHeight:18, marginBottom:20 },
  payChoiceRow: { flexDirection:'row', gap:10, marginBottom:25 },
  payChoiceBtn: { flex:1, backgroundColor:'#111', padding:15, borderRadius:18, alignItems:'center', borderWidth:1, borderColor:'#222' },
  payChoiceBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryDim },
  payEmoji: { fontSize:28, marginBottom:8 },
  payChoiceText: { color:'#FFF', fontSize:9, fontWeight:'bold', textAlign:'center' },
  pDetailBox: { backgroundColor:'#000', padding:20, borderRadius:20, width:'100%', alignItems:'center' },
  pDetailTitle: { color: COLORS.primary, fontSize:10, fontWeight:'bold', marginBottom:15 },
  pDetailSub: { color: '#FFF', fontSize:18, fontWeight:'bold' },
  ibanText: { color: '#FFF', fontSize:13, marginTop:10, fontWeight:'bold' },
  payBtn: { backgroundColor: COLORS.primary, padding:18, borderRadius:15, width:'100%', alignItems:'center', marginTop:15 },
});
