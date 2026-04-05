import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://insify.onrender.com';
const WS_URL = API_BASE_URL.replace('http', 'ws') + '/ws/live/main_room';

export default function LiveRoomScreen() {
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [username, setUsername] = useState('Guest');
  const ws = useRef<WebSocket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem('loggedInUser');
      if (stored) setUsername(stored);
      connectWebSocket(stored || 'Guest');
    })();
    return () => {
      if (ws.current) ws.current.close();
    };
  }, []);

  const connectWebSocket = (user: string) => {
    ws.current = new WebSocket(`${WS_URL}/${user}`);
    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev, data]);
      } catch (e) {
        console.error("Invalid WS message");
      }
    };
  };

  const sendMessage = () => {
    if (!inputText.trim() || !ws.current) return;
    ws.current.send(inputText);
    setInputText('');
  };

  const renderMessage = ({ item }: { item: any }) => {
    if (item.type === 'system') {
      return <Text style={styles.systemText}>{item.text}</Text>;
    }
    const isMe = item.client_id === username;
    return (
      <View style={[styles.msgBubble, isMe ? styles.myMsg : styles.theirMsg]}>
        {!isMe && <Text style={styles.msgSender}>{item.client_id}</Text>}
        <Text style={styles.msgText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.liveIndicator}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE: VIBE ROOM</Text>
        </View>
        <Text style={styles.djText}>DJ: Parity</Text>
      </View>

      <View style={styles.nowPlayingBox}>
        <Text style={styles.nowPlayingLabel}>NOW PLAYING</Text>
        <Text style={styles.nowPlayingTrack}>Open Spotify to sync audio</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={renderMessage}
        contentContainerStyle={styles.chatList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          placeholder="Hype up the DJ..."
          placeholderTextColor="#666"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
          <Text style={styles.sendText}>→</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    backgroundColor: '#CCFF00', borderBottomWidth: 4, borderBottomColor: '#FFF',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FF0000', paddingHorizontal: 12, paddingVertical: 6, borderWidth: 2, borderColor: '#000' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF', marginRight: 6 },
  liveText: { color: '#FFF', fontWeight: '900', fontSize: 12, letterSpacing: 1 },
  djText: { color: '#000', fontWeight: '900', fontSize: 14, textTransform: 'uppercase' },
  nowPlayingBox: { backgroundColor: '#FF007F', padding: 20, borderBottomWidth: 4, borderBottomColor: '#FFF' },
  nowPlayingLabel: { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginVertical: 4 },
  nowPlayingTrack: { color: '#000', fontSize: 18, fontWeight: '900' },
  chatList: { padding: 20 },
  msgBubble: { padding: 12, marginVertical: 4, maxWidth: '80%', borderWidth: 2, borderColor: '#FFF' },
  myMsg: { backgroundColor: '#CCFF00', alignSelf: 'flex-end', transform: [{rotate: '1deg'}] },
  theirMsg: { backgroundColor: '#00FFFF', alignSelf: 'flex-start', transform: [{rotate: '-1deg'}] },
  msgSender: { fontSize: 10, fontWeight: '900', marginBottom: 4, color: '#000', textTransform: 'uppercase' },
  msgText: { fontSize: 14, fontWeight: '700', color: '#000' },
  systemText: { color: '#888', fontStyle: 'italic', fontSize: 12, textAlign: 'center', marginVertical: 8 },
  inputRow: { flexDirection: 'row', padding: 16, borderTopWidth: 4, borderTopColor: '#FFF', backgroundColor: '#000' },
  input: { flex: 1, backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, fontWeight: '700', borderWidth: 2, borderColor: '#FF007F', color: '#000' },
  sendBtn: { backgroundColor: '#FF007F', paddingHorizontal: 20, justifyContent: 'center', marginLeft: 8, borderWidth: 2, borderColor: '#FFF' },
  sendText: { color: '#FFF', fontSize: 20, fontWeight: '900' }
});
