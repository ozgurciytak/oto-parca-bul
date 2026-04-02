import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { COLORS } from '../theme';
import { API_URL } from '../config';

export default function ChatScreen({ user, receiverId, receiverName, onBack }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef();

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // 3 saniyede bir yeni mesaj var mı bak
    return () => clearInterval(interval);
  }, []);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`${API_URL}/messages/${user._id}/${receiverId}`);
      const data = await res.json();
      if(res.ok) setMessages(data);
    } catch(e) {}
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    if(!newMessage.trim()) return;
    
    // Geçici olarak listede hemen göster (WhatsApp hızı!)
    const tempMsg = { _id: Date.now().toString(), from: user._id, content: newMessage, createdAt: new Date() };
    setMessages([...messages, tempMsg]);
    const textToSend = newMessage;
    setNewMessage('');

    try {
      const res = await fetch(`${API_URL}/messages/send`, {
        method: 'POST', headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ from: user._id, to: receiverId, content: textToSend })
      });
      const data = await res.json();
      if(!res.ok) {
          Alert.alert('⚠️ HESAP DONDURULDU', data.message);
          onBack();
      } else {
          fetchMessages();
      }
    } catch(e) { Alert.alert('Hata', 'Mesaj iletilemedi.'); }
  };

  const renderMessage = ({ item }) => {
    const isMine = item.from === user._id;
    return (
      <View style={[styles.bubbleContainer, isMine ? styles.myMsgContainer : styles.theirMsgContainer]}>
        <View style={[styles.bubble, isMine ? styles.myBubble : styles.theirBubble]}>
          <Text style={[styles.msgText, isMine ? {color: '#000'} : {color: '#FFF'}]}>{item.content}</Text>
          <Text style={styles.timeText}>{new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}><Text style={styles.backText}>←</Text></TouchableOpacity>
        <View style={styles.avatar}><Text style={{color: '#FFF', fontWeight: 'bold'}}>{receiverName[0]}</Text></View>
        <View style={{marginLeft: 12}}>
            <Text style={styles.headerName}>{receiverName}</Text>
            <Text style={styles.onlineStatus}>çevrimiçi</Text>
        </View>
      </View>

      <FlatList 
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item._id}
        contentContainerStyle={{padding: 15, paddingBottom: 20}}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({animated: true})}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
        <View style={styles.inputArea}>
            <TextInput 
                style={styles.input} 
                placeholder="Mesaj yazın..." 
                placeholderTextColor="#999" 
                value={newMessage} 
                onChangeText={setNewMessage}
                multiline
            />
            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                <Text style={styles.sendBtnIcon}>➤</Text>
            </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0B141A' }, // WhatsApp Koyu Tema Rengi
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, paddingTop: 45, backgroundColor: '#1F2C34', borderBottomWidth: 1, borderBottomColor: '#333' },
  backBtn: { padding: 10, marginRight: 5 },
  backText: { color: '#00A884', fontSize: 24, fontWeight: 'bold' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#666', justifyContent: 'center', alignItems: 'center' },
  headerName: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  onlineStatus: { color: '#00A884', fontSize: 11 },
  bubbleContainer: { width: '100%', marginBottom: 10, flexDirection: 'row' },
  myMsgContainer: { justifyContent: 'flex-end' },
  theirMsgContainer: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 15 },
  myBubble: { backgroundColor: '#005C4B', borderTopRightRadius: 0 }, // WhatsApp Koyu Yeşil
  theirBubble: { backgroundColor: '#1F2C34', borderTopLeftRadius: 0 },
  msgText: { fontSize: 15, lineHeight: 20 },
  timeText: { fontSize: 10, alignSelf: 'flex-end', marginTop: 4, color: 'rgba(255,255,255,0.5)' },
  inputArea: { flexDirection: 'row', padding: 10, alignItems: 'center', backgroundColor: '#1F2C34' },
  input: { flex: 1, backgroundColor: '#2A3942', color: '#FFF', borderRadius: 25, paddingHorizontal: 20, paddingVertical: 10, maxHeight: 100, fontSize: 16 },
  sendBtn: { backgroundColor: '#00A884', width: 45, height: 45, borderRadius: 22.5, marginLeft: 10, justifyContent: 'center', alignItems: 'center' },
  sendBtnIcon: { color: '#FFF', fontSize: 20 }
});
