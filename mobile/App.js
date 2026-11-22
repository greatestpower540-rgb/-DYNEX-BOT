import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  View, Text, Image, TextInput, ScrollView, Pressable, StatusBar,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Keyboard, Share
} from "react-native";

const API_URL = "https://dynex-bot-ai5dcf.destinychukwudi209.workers.dev/chat";
const makeId = () => String(Date.now()) + Math.random().toString(36).slice(2, 7);
const starter = { id: "welcome", role: "assistant", content: "Hi! I'm DYNEX, your AI assistant. Ask me anything — I can explain ideas, help you write, learn, plan, and solve problems." };
const tools = [
  ["✍️", "Writing Studio", "Help me write a clear, professional piece of writing. Ask what I need if necessary."],
  ["💻", "Coding Studio", "Act as my coding assistant. Help me write, understand, and debug code."],
  ["🔎", "Research Assistant", "Help me research this topic carefully, explain key points, and identify what needs verification."],
  ["🎓", "AI Tutor", "Teach me step by step. Explain simply, then give me a short practice quiz."],
  ["🌍", "Translator", "Help me translate text accurately and preserve its tone."],
  ["📅", "Day Planner", "Help me organize my tasks and make a realistic daily plan."],
  ["💼", "Business Assistant", "Help me think through a business idea, customers, costs, and practical next steps."]
];

export default function App() {
  const [chats, setChats] = useState([{ id: "first", title: "New conversation", messages: [starter], pinned: false }]);
  const [activeId, setActiveId] = useState("first");
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [screen, setScreen] = useState("chat");
  const [search, setSearch] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const scrollRef = useRef(null);
  const activeChat = chats.find(c => c.id === activeId) || chats[0];
  const messages = activeChat?.messages || [starter];

  useEffect(() => {
    let mounted = true;
    const restoreHistory = async () => {
      try {
        const saved = await AsyncStorage.getItem("dynex_chat_history_v1");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed.chats) && parsed.chats.length > 0 && mounted) {
            setChats(parsed.chats);
            const savedActive = parsed.chats.some(chat => chat.id === parsed.activeId)
              ? parsed.activeId : parsed.chats[0].id;
            setActiveId(savedActive);
          }
        }
      } catch (error) {
        console.warn("DYNEX chat history could not be restored.", error);
      } finally {
        if (mounted) setHistoryLoaded(true);
      }
    };
    restoreHistory();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!historyLoaded) return;
    AsyncStorage.setItem("dynex_chat_history_v1", JSON.stringify({ chats, activeId }))
      .catch(error => console.warn("DYNEX chat history could not be saved.", error));
  }, [chats, activeId, historyLoaded]);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(timer);
  }, [messages, busy, screen]);

  const updateMessages = (updater) => setChats(current => current.map(c =>
    c.id === activeId ? { ...c, messages: typeof updater === "function" ? updater(c.messages) : updater } : c
  ));

  const newChat = () => {
    const id = makeId();
    setChats(current => [{ id, title: "New conversation", messages: [starter], pinned: false }, ...current]);
    setActiveId(id);
    setDraft("");
    setScreen("chat");
  };

  const sendMessage = async (overrideText) => {
    const text = String(overrideText ?? draft).trim();
    if (!text || busy) return;
    Keyboard.dismiss();
    setDraft("");
    const userMessage = { id: makeId(), role: "user", content: text };
    const next = [...messages, userMessage];
    updateMessages(next);
    setChats(current => current.map(c => c.id === activeId && c.title === "New conversation"
      ? { ...c, title: text.slice(0, 38) } : c));
    setBusy(true);
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter(item => item.id !== "welcome").slice(-20).map(({ role, content }) => ({ role, content })) })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = data.error || "The AI service returned an error.";
        const status = data.provider_status ? ` (provider status: ${data.provider_status})` : ` (HTTP ${response.status})`;
        throw new Error(detail + status);
      }
      const answer = String(data.reply || "").trim();
      if (!answer) throw new Error("DYNEX returned an empty reply. Please try again.");
      updateMessages(current => [...current, { id: makeId(), role: "assistant", content: answer }]);
    } catch (error) {
      const detail = error?.message || "Unknown connection error.";
      updateMessages(current => [...current, { id: makeId(), role: "assistant", content: `DYNEX couldn't complete that request: ${detail}` }]);
    } finally {
      setBusy(false);
    }
  };

  const regenerate = () => {
    if (busy) return;
    const prior = messages.slice(0, -1);
    const lastUser = [...prior].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    updateMessages(prior);
    setTimeout(() => sendMessage(lastUser.content), 50);
  };

  const deleteChat = (id) => Alert.alert("Delete conversation", "This conversation will be removed from this session.", [
    { text: "Cancel", style: "cancel" },
    { text: "Delete", style: "destructive", onPress: () => {
      const remaining = chats.filter(c => c.id !== id);
      if (!remaining.length) {
        const fresh = { id: makeId(), title: "New conversation", messages: [starter], pinned: false };
        setChats([fresh]); setActiveId(fresh.id);
      } else {
        setChats(remaining);
        if (activeId === id) setActiveId(remaining[0].id);
      }
    }}
  ]);

  const shareText = async (text) => {
    try { await Share.share({ message: text }); } catch {}
  };

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.messages.some(m => m.content.toLowerCase().includes(search.toLowerCase())));
  const quickTools = (item) => { setScreen("chat"); setDraft(item[2]); };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <KeyboardAvoidingView style={[styles.container, Platform.OS === "android" && styles.androidContainer]} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image source={require("./assets/icon.png")} style={styles.avatar} />
            <View><Text style={styles.brandName}>DYNEX</Text><View style={styles.onlineRow}><View style={styles.onlineDot} /><Text style={styles.onlineText}>AI ASSISTANT</Text></View></View>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerButton} onPress={() => setScreen(screen === "history" ? "chat" : "history")}><Text style={styles.headerButtonText}>☷</Text></Pressable>
            <Pressable style={styles.newChat} onPress={newChat}><Text style={styles.newChatText}>＋</Text></Pressable>
          </View>
        </View>

        {screen === "history" ? (
          <View style={styles.page}>
            <Text style={styles.pageTitle}>Your conversations</Text>
            <TextInput style={styles.search} placeholder="Search chats..." placeholderTextColor="#929A94" value={search} onChangeText={setSearch} />
            <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
              {filteredChats.sort((a,b) => Number(b.pinned)-Number(a.pinned)).map(chat => (
                <View key={chat.id} style={styles.chatCard}>
                  <Pressable style={{ flex: 1 }} onPress={() => { setActiveId(chat.id); setScreen("chat"); }}>
                    <Text style={styles.chatTitle}>{chat.pinned ? "📌 " : ""}{chat.title}</Text>
                    <Text style={styles.chatPreview} numberOfLines={1}>{chat.messages.filter(m=>m.id!=="welcome").slice(-1)[0]?.content || "No messages yet"}</Text>
                  </Pressable>
                  <Pressable style={styles.smallAction} onPress={() => setChats(current => current.map(c => c.id === chat.id ? { ...c, pinned: !c.pinned } : c))}><Text>{chat.pinned ? "📌" : "☆"}</Text></Pressable>
                  <Pressable style={styles.smallAction} onPress={() => deleteChat(chat.id)}><Text>🗑</Text></Pressable>
                </View>
              ))}
              {!filteredChats.length && <Text style={styles.emptyText}>No matching conversations.</Text>}
            </ScrollView>
            <Pressable style={styles.primaryButton} onPress={newChat}><Text style={styles.primaryButtonText}>＋  New conversation</Text></Pressable>
          </View>
        ) : screen === "tools" ? (
          <View style={styles.page}>
            <Text style={styles.pageTitle}>DYNEX AI tools</Text>
            <Text style={styles.pageSub}>Choose a workspace to get started.</Text>
            <ScrollView contentContainerStyle={styles.toolGrid}>
              {tools.map(item => <Pressable key={item[1]} style={styles.toolCard} onPress={() => quickTools(item)}><Text style={styles.toolIcon}>{item[0]}</Text><Text style={styles.toolTitle}>{item[1]}</Text><Text style={styles.toolHint}>Start with DYNEX ↗</Text></Pressable>)}
            </ScrollView>
          </View>
        ) : (
          <ScrollView ref={scrollRef} style={styles.chat} contentContainerStyle={styles.chatContent} keyboardShouldPersistTaps="handled">
            {messages.length === 1 && (
              <View style={styles.welcome}>
                <Image source={require("./assets/icon.png")} style={styles.heroRobot} resizeMode="contain" />
                <Text style={styles.welcomeTitle}>What can I help with?</Text>
                <Text style={styles.welcomeSub}>Think clearly. Create freely. Get things done.</Text>
                <View style={styles.suggestions}>
                  {["Explain something to me", "Help me write", "Plan my day"].map(item => <Pressable key={item} style={styles.suggestion} onPress={() => setDraft(item)}><Text style={styles.suggestionText}>{item}</Text><Text style={styles.suggestionArrow}>↗</Text></Pressable>)}
                </View>
              </View>
            )}
            {messages.map(item => item.id === "welcome" ? null : (
              <View key={item.id} style={[styles.messageRow, item.role === "user" ? styles.userRow : styles.assistantRow]}>
                {item.role === "assistant" && <Image source={require("./assets/icon.png")} style={styles.messageAvatar} />}
                <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}>
                  <Text selectable style={[styles.messageText, item.role === "user" ? styles.userText : styles.assistantText]}>{item.content}</Text>
                  {item.role === "assistant" && <View style={styles.messageActions}>
                    <Pressable onPress={() => shareText(item.content)}><Text style={styles.actionText}>↗ Share</Text></Pressable>
                    <Pressable onPress={() => shareText(item.content)}><Text style={styles.actionText}>Copy / Share</Text></Pressable>
                  </View>}
                </View>
              </View>
            ))}
            {busy && <View style={styles.typing}><Image source={require("./assets/icon.png")} style={styles.messageAvatar} /><View style={styles.typingBubble}><ActivityIndicator size="small" color="#218B55" /><Text style={styles.typingText}>DYNEX is thinking…</Text></View></View>}
            {!busy && messages.some(m => m.role === "assistant" && m.id !== "welcome") && <Pressable style={styles.regenerate} onPress={regenerate}><Text style={styles.actionText}>↻ Regenerate last answer</Text></Pressable>}
          </ScrollView>
        )}

        {screen === "chat" && <View style={styles.composer}>
          <TextInput style={styles.input} placeholder="Message DYNEX..." placeholderTextColor="#929A94" value={draft} onChangeText={setDraft} multiline maxLength={6000} editable={!busy} returnKeyType="default" />
          <View style={styles.composerBottom}>
            <Pressable onPress={() => setScreen("tools")}><Text style={styles.toolsLink}>✣ Tools</Text></Pressable>
            <Text style={styles.hint}>DYNEX can make mistakes. Check important information.</Text>
            <Pressable style={[styles.sendButton, (!draft.trim() || busy) && styles.sendDisabled]} onPress={() => sendMessage()} disabled={!draft.trim() || busy}>
              {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.sendIcon}>↑</Text>}
            </Pressable>
          </View>
        </View>}
        {screen !== "chat" && <View style={styles.bottomNav}>
          <Pressable style={styles.navItem} onPress={() => setScreen("chat")}><Text style={styles.navIcon}>⌂</Text><Text style={styles.navText}>Chat</Text></Pressable>
          <Pressable style={styles.navItem} onPress={() => setScreen("history")}><Text style={styles.navIcon}>☷</Text><Text style={styles.navText}>History</Text></Pressable>
          <Pressable style={styles.navItem} onPress={() => setScreen("tools")}><Text style={styles.navIcon}>✣</Text><Text style={styles.navText}>AI Tools</Text></Pressable>
        </View>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#FFF"}, container:{flex:1,backgroundColor:"#FFF"}, androidContainer:{paddingBottom:28},
  header:{height:68,paddingHorizontal:19,borderBottomWidth:1,borderBottomColor:"#F0F2F0",flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  brand:{flexDirection:"row",alignItems:"center",gap:11}, avatar:{width:43,height:43,borderRadius:22,backgroundColor:"#F1F7F2"},
  brandName:{color:"#17231B",fontSize:18,fontWeight:"900",letterSpacing:1.1},onlineRow:{flexDirection:"row",alignItems:"center",gap:5,marginTop:3},
  onlineDot:{width:6,height:6,borderRadius:3,backgroundColor:"#2BB66A"},onlineText:{color:"#7A897E",fontSize:9,fontWeight:"800",letterSpacing:1.2},
  headerActions:{flexDirection:"row",alignItems:"center",gap:9},headerButton:{width:40,height:40,borderRadius:21,backgroundColor:"#F3F6F3",alignItems:"center",justifyContent:"center"},
  headerButtonText:{fontSize:22,color:"#1E3827"},newChat:{width:42,height:42,borderRadius:22,backgroundColor:"#F3F6F3",alignItems:"center",justifyContent:"center"},
  newChatText:{color:"#1E3827",fontSize:27,lineHeight:30},chat:{flex:1},chatContent:{flexGrow:1,paddingHorizontal:14,paddingTop:12,paddingBottom:12},
  welcome:{flex:1,minHeight:440,alignItems:"center",justifyContent:"center",paddingHorizontal:10},heroRobot:{width:132,height:132,marginBottom:20},
  welcomeTitle:{fontSize:26,lineHeight:33,fontWeight:"800",color:"#17231B",textAlign:"center"},welcomeSub:{fontSize:14,color:"#7B877F",marginTop:8,textAlign:"center"},
  suggestions:{width:"100%",gap:9,marginTop:30},suggestion:{minHeight:49,borderWidth:1,borderColor:"#E8EEE9",borderRadius:15,paddingHorizontal:15,flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:"#FFF"},
  suggestionText:{color:"#3A4B3F",fontSize:14,fontWeight:"600"},suggestionArrow:{color:"#24935A",fontSize:18},
  messageRow:{flexDirection:"row",alignItems:"flex-end",marginBottom:12,gap:7},userRow:{justifyContent:"flex-end"},assistantRow:{justifyContent:"flex-start"},
  messageAvatar:{width:27,height:27,borderRadius:14,marginBottom:3},bubble:{maxWidth:"90%",borderRadius:17,paddingHorizontal:13,paddingVertical:10},
  userBubble:{backgroundColor:"#EAF5ED",borderBottomRightRadius:5},assistantBubble:{backgroundColor:"#F5F6F5",borderBottomLeftRadius:5},
  messageText:{fontSize:15,lineHeight:23},userText:{color:"#20392A"},assistantText:{color:"#202923"},
  messageActions:{flexDirection:"row",gap:15,marginTop:10,borderTopWidth:1,borderTopColor:"#E8ECE9",paddingTop:7},
  actionText:{color:"#278653",fontSize:12,fontWeight:"700"},regenerate:{alignSelf:"flex-start",marginLeft:35,marginBottom:15,padding:8},
  typing:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:12},typingBubble:{flexDirection:"row",alignItems:"center",gap:9,backgroundColor:"#F5F6F5",paddingHorizontal:14,paddingVertical:12,borderRadius:18},
  typingText:{color:"#728078",fontSize:13},composer:{marginHorizontal:10,marginBottom:4,paddingHorizontal:13,paddingTop:10,paddingBottom:8,borderWidth:1,borderColor:"#E5EBE6",borderRadius:23,backgroundColor:"#FFF",elevation:3,shadowColor:"#17231B",shadowOpacity:.06,shadowRadius:9,shadowOffset:{width:0,height:3}},
  input:{minHeight:40,maxHeight:105,color:"#17231B",fontSize:15,lineHeight:21,textAlignVertical:"top",paddingTop:4},
  composerBottom:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:7,gap:7},hint:{color:"#9AA39D",fontSize:9,flex:1},
  toolsLink:{color:"#218B55",fontSize:12,fontWeight:"800"},sendButton:{width:39,height:39,borderRadius:20,backgroundColor:"#1F8C53",alignItems:"center",justifyContent:"center"},
  sendDisabled:{backgroundColor:"#AAB8AE"},sendIcon:{color:"#FFF",fontSize:25,fontWeight:"800",marginTop:-2},
  page:{flex:1,padding:18},pageTitle:{fontSize:23,fontWeight:"900",color:"#17231B",marginBottom:8},pageSub:{fontSize:13,color:"#7B877F",marginBottom:15},
  search:{borderWidth:1,borderColor:"#E5EBE6",borderRadius:13,paddingHorizontal:14,paddingVertical:11,color:"#17231B",marginVertical:12},
  chatCard:{flexDirection:"row",alignItems:"center",gap:8,padding:14,borderWidth:1,borderColor:"#E8EEE9",borderRadius:15,marginBottom:9},
  chatTitle:{fontSize:14,fontWeight:"800",color:"#24372B"},chatPreview:{fontSize:11,color:"#7B877F",marginTop:4},smallAction:{padding:8},emptyText:{textAlign:"center",color:"#7B877F",marginTop:30},
  primaryButton:{backgroundColor:"#1F8C53",padding:15,borderRadius:14,alignItems:"center",marginTop:10},primaryButtonText:{color:"#FFF",fontWeight:"800"},
  toolGrid:{flexDirection:"row",flexWrap:"wrap",gap:10,paddingVertical:12},toolCard:{width:"48%",minHeight:125,borderWidth:1,borderColor:"#E5EBE6",borderRadius:16,padding:13,backgroundColor:"#FFF"},
  toolIcon:{fontSize:25,marginBottom:9},toolTitle:{fontSize:13,fontWeight:"800",color:"#24372B"},toolHint:{fontSize:10,color:"#278653",marginTop:8},
  bottomNav:{height:60,borderTopWidth:1,borderTopColor:"#EEF1EE",flexDirection:"row",justifyContent:"space-around",alignItems:"center"},
  navItem:{alignItems:"center",justifyContent:"center",minWidth:70},navIcon:{fontSize:20,color:"#218B55"},navText:{fontSize:10,color:"#728078",marginTop:2}
});
