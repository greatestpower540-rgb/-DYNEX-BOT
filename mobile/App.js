// DYNEX media attachments use Expo SDK 58 image, document, and file-system modules.
import React, { useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { File } from "expo-file-system";
import {
  View, Text, Image, TextInput, ScrollView, Pressable, StatusBar,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Keyboard, Share, Modal
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [attachment, setAttachment] = useState(null);
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
    setAttachment(null);
    setDrawerOpen(false);
    setScreen("chat");
  };

  const sendMessage = async (overrideText) => {
    const selected = attachment;
    const text = String(overrideText ?? draft).trim();
    if ((!text && !selected) || busy) return;
    const messageText = text || `Please analyze the attached ${selected.kind === "image" ? "image" : "file"}: ${selected.name}.`;
    Keyboard.dismiss();
    setDraft("");
    setAttachment(null);
    const metadata = selected ? [{
      name: selected.name, mimeType: selected.mimeType, uri: selected.uri,
      kind: selected.kind, size: selected.size || 0
    }] : [];
    const userMessage = { id: makeId(), role: "user", content: messageText, ...(metadata.length ? { attachments: metadata } : {}) };
    const next = [...messages, userMessage];
    updateMessages(next);
    setChats(current => current.map(c => c.id === activeId && c.title === "New conversation"
      ? { ...c, title: messageText.slice(0, 38) } : c));
    setBusy(true);
    try {
      const apiMessages = next.filter(item => item.id !== "welcome").slice(-20).map(item => ({
        role: item.role,
        content: item.content,
        ...(item.id === userMessage.id && selected ? {
          attachments: [{
            name: selected.name,
            mimeType: selected.mimeType,
            ...(selected.textContent !== undefined ? { text: selected.textContent } : { data: selected.data })
          }]
        } : {})
      }));
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages })
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

  const deleteChat = (id) => Alert.alert("Delete conversation", "This conversation will be removed from this device.", [
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

  const MAX_ATTACHMENT_BYTES = 8 * 1024 * 1024;

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"], allowsEditing: false, quality: 0.8, base64: true
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      const encoded = asset.base64 || await new File(asset.uri).base64();
      const estimatedBytes = asset.fileSize || Math.floor(encoded.length * 0.75);
      if (estimatedBytes > MAX_ATTACHMENT_BYTES) {
        Alert.alert("Image is too large", "Please choose an image smaller than 8 MB.");
        return;
      }
      setAttachment({
        name: asset.fileName || `image-${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
        uri: asset.uri,
        kind: "image",
        size: estimatedBytes,
        data: encoded
      });
    } catch (error) {
      Alert.alert("Could not select image", error?.message || "Please try again.");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "text/plain", "text/csv", "application/json"],
        copyToCacheDirectory: true,
        multiple: false
      });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      if (asset.size && asset.size > MAX_ATTACHMENT_BYTES) {
        Alert.alert("File is too large", "Please choose a file smaller than 8 MB.");
        return;
      }
      const mimeType = asset.mimeType || "application/pdf";
      const file = new File(asset.uri);
      const isText = mimeType.startsWith("text/") || mimeType === "application/json";
      const selected = {
        name: asset.name || "document",
        mimeType,
        uri: asset.uri,
        kind: "file",
        size: asset.size || 0,
        ...(isText ? { textContent: await file.text() } : { data: await file.base64() })
      };
      if (selected.textContent && selected.textContent.length > 8 * 1024 * 1024) {
        Alert.alert("File is too large", "Please choose a file smaller than 8 MB.");
        return;
      }
      setAttachment(selected);
    } catch (error) {
      Alert.alert("Could not select file", error?.message || "Please try again.");
    }
  };

  const chooseAttachment = () => Alert.alert("Add to DYNEX", "Choose what you want to attach.", [
    { text: "Image from gallery", onPress: pickImage },
    { text: "Document or file", onPress: pickDocument },
    { text: "Cancel", style: "cancel" }
  ]);

  const showMoreOptions = () => Alert.alert("DYNEX", "Choose an option.", [
    { text: "Chat history", onPress: () => setScreen("history") },
    { text: "AI tools", onPress: () => setScreen("tools") },
    { text: "New conversation", onPress: newChat },
    { text: "Cancel", style: "cancel" }
  ]);

  const filteredChats = chats.filter(c => c.title.toLowerCase().includes(search.toLowerCase()) || c.messages.some(m => m.content.toLowerCase().includes(search.toLowerCase())));
  const quickTools = (item) => { setScreen("chat"); setDraft(item[2]); };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <KeyboardAvoidingView style={[styles.container, Platform.OS === "android" && styles.androidContainer]} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}>
        <View style={styles.header}>
          <Pressable style={styles.headerIcon} onPress={() => setDrawerOpen(true)} accessibilityLabel="Open menu"><Text style={styles.headerIconText}>☰</Text></Pressable>
          <View style={styles.brand}>
            <Image source={require("./assets/icon.png")} style={styles.avatar} />
            <View><Text style={styles.brandName}>DYNEX</Text><View style={styles.onlineRow}><View style={styles.onlineDot} /><Text style={styles.onlineText}>AI ASSISTANT</Text></View></View>
          </View>
          <View style={styles.headerActions}>
            <Pressable style={styles.headerIcon} onPress={newChat} accessibilityLabel="New conversation"><Text style={styles.headerIconText}>✎</Text></Pressable>
            <Pressable style={styles.headerIcon} onPress={showMoreOptions} accessibilityLabel="More options"><Text style={styles.headerIconText}>⋮</Text></Pressable>
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
                  {item.attachments?.map((file, index) => file.kind === "image"
                    ? <Image key={index} source={{ uri: file.uri }} style={styles.messageImage} resizeMode="cover" />
                    : <View key={index} style={styles.messageFile}><Text style={styles.messageFileText}>📎  {file.name}</Text></View>)}
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
          {attachment && <View style={styles.attachmentPreview}>
            {attachment.kind === "image"
              ? <Image source={{ uri: attachment.uri }} style={styles.attachmentThumb} />
              : <View style={styles.fileGlyph}><Text style={styles.fileGlyphText}>FILE</Text></View>}
            <View style={styles.attachmentInfo}><Text numberOfLines={1} style={styles.attachmentName}>{attachment.name}</Text><Text style={styles.attachmentType}>{attachment.kind === "image" ? "Image attached" : "File attached"}</Text></View>
            <Pressable onPress={() => setAttachment(null)} style={styles.removeAttachment}><Text style={styles.removeAttachmentText}>×</Text></Pressable>
          </View>}
          <View style={styles.composeRow}>
            <Pressable style={styles.attachButton} onPress={chooseAttachment} disabled={busy} accessibilityLabel="Add image or file"><Text style={styles.attachButtonText}>＋</Text></Pressable>
            <TextInput style={styles.input} placeholder="Message DYNEX..." placeholderTextColor="#929A94" value={draft} onChangeText={setDraft} multiline maxLength={6000} editable={!busy} returnKeyType="default" />
            <Pressable style={[styles.sendButton, (!draft.trim() && !attachment || busy) && styles.sendDisabled]} onPress={() => sendMessage()} disabled={(!draft.trim() && !attachment) || busy}>
              {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.sendIcon}>↑</Text>}
            </Pressable>
          </View>
          <View style={styles.composerFooter}>
            <Pressable onPress={() => setScreen("tools")}><Text style={styles.toolsLink}>✣ Tools</Text></Pressable>
            <Text style={styles.hint}>DYNEX can make mistakes. Check important information.</Text>
          </View>
        </View>}
        {screen !== "chat" && <View style={styles.bottomNav}>
          <Pressable style={styles.navItem} onPress={() => setScreen("chat")}><Text style={styles.navIcon}>⌂</Text><Text style={styles.navText}>Chat</Text></Pressable>
          <Pressable style={styles.navItem} onPress={() => setScreen("history")}><Text style={styles.navIcon}>☷</Text><Text style={styles.navText}>History</Text></Pressable>
          <Pressable style={styles.navItem} onPress={() => setScreen("tools")}><Text style={styles.navIcon}>✣</Text><Text style={styles.navText}>AI Tools</Text></Pressable>
        </View>}
      </KeyboardAvoidingView>
      <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.drawerRoot}>
          <Pressable style={styles.drawerShade} onPress={() => setDrawerOpen(false)} />
          <View style={styles.drawerPanel}>
            <View style={styles.drawerTop}>
              <View style={styles.drawerBrand}><Image source={require("./assets/icon.png")} style={styles.drawerAvatar} /><Text style={styles.drawerTitle}>DYNEX</Text></View>
              <Pressable onPress={() => setDrawerOpen(false)} style={styles.drawerClose}><Text style={styles.drawerCloseText}>×</Text></Pressable>
            </View>
            <Pressable style={styles.drawerAction} onPress={newChat}><Text style={styles.drawerActionIcon}>＋</Text><Text style={styles.drawerActionText}>New conversation</Text></Pressable>
            <Pressable style={styles.drawerItem} onPress={() => { setScreen("chat"); setDrawerOpen(false); }}><Text style={styles.drawerItemIcon}>⌂</Text><Text style={styles.drawerItemText}>Chat</Text></Pressable>
            <Pressable style={styles.drawerItem} onPress={() => { setScreen("history"); setDrawerOpen(false); }}><Text style={styles.drawerItemIcon}>☷</Text><Text style={styles.drawerItemText}>Chat history</Text></Pressable>
            <Pressable style={styles.drawerItem} onPress={() => { setScreen("tools"); setDrawerOpen(false); }}><Text style={styles.drawerItemIcon}>✣</Text><Text style={styles.drawerItemText}>AI tools</Text></Pressable>
            <Text style={styles.drawerSection}>Recent conversations</Text>
            <ScrollView style={styles.drawerRecent}>
              {chats.slice(0, 12).map(chat => <Pressable key={chat.id} style={styles.drawerChat} onPress={() => { setActiveId(chat.id); setScreen("chat"); setDrawerOpen(false); }}>
                <Text numberOfLines={1} style={styles.drawerChatText}>{chat.pinned ? "📌 " : ""}{chat.title}</Text>
              </Pressable>)}
            </ScrollView>
            <Text style={styles.drawerFooter}>DYNEX AI ASSISTANT</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:{flex:1,backgroundColor:"#FFF"}, container:{flex:1,backgroundColor:"#FFF"}, androidContainer:{paddingBottom:24},
  header:{height:64,paddingHorizontal:12,borderBottomWidth:1,borderBottomColor:"#F0F2F0",flexDirection:"row",alignItems:"center",justifyContent:"space-between"},
  headerIcon:{width:40,height:40,borderRadius:21,backgroundColor:"#F3F6F3",alignItems:"center",justifyContent:"center"},
  headerIconText:{fontSize:22,color:"#1E3827",fontWeight:"700"},
  brand:{flex:1,flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8},
  avatar:{width:35,height:35,borderRadius:18,backgroundColor:"#F1F7F2"},
  brandName:{color:"#17231B",fontSize:17,fontWeight:"900",letterSpacing:1},
  onlineRow:{flexDirection:"row",alignItems:"center",gap:4,marginTop:2},
  onlineDot:{width:6,height:6,borderRadius:3,backgroundColor:"#2BB66A"},
  onlineText:{color:"#7A897E",fontSize:8,fontWeight:"800",letterSpacing:1.1},
  headerActions:{flexDirection:"row",alignItems:"center",gap:7},
  chat:{flex:1},chatContent:{flexGrow:1,paddingHorizontal:14,paddingTop:12,paddingBottom:12},
  welcome:{flex:1,minHeight:390,alignItems:"center",justifyContent:"center",paddingHorizontal:10},
  heroRobot:{width:116,height:116,marginBottom:16},
  welcomeTitle:{fontSize:24,lineHeight:31,fontWeight:"800",color:"#17231B",textAlign:"center"},
  welcomeSub:{fontSize:13,color:"#7B877F",marginTop:7,textAlign:"center"},
  suggestions:{width:"100%",gap:8,marginTop:24},
  suggestion:{minHeight:46,borderWidth:1,borderColor:"#E8EEE9",borderRadius:15,paddingHorizontal:14,flexDirection:"row",alignItems:"center",justifyContent:"space-between",backgroundColor:"#FFF"},
  suggestionText:{color:"#3A4B3F",fontSize:13,fontWeight:"600"},suggestionArrow:{color:"#24935A",fontSize:18},
  messageRow:{flexDirection:"row",alignItems:"flex-end",marginBottom:12,gap:7},userRow:{justifyContent:"flex-end"},assistantRow:{justifyContent:"flex-start"},
  messageAvatar:{width:27,height:27,borderRadius:14,marginBottom:3},
  bubble:{maxWidth:"90%",borderRadius:17,paddingHorizontal:13,paddingVertical:10},
  userBubble:{backgroundColor:"#EAF5ED",borderBottomRightRadius:5},assistantBubble:{backgroundColor:"#F5F6F5",borderBottomLeftRadius:5},
  messageText:{fontSize:15,lineHeight:22},userText:{color:"#20392A"},assistantText:{color:"#202923"},
  messageImage:{width:210,height:170,borderRadius:13,marginBottom:8,backgroundColor:"#E8EEE9"},
  messageFile:{padding:9,borderRadius:10,backgroundColor:"#E5F0E8",marginBottom:8},
  messageFileText:{color:"#245B3B",fontSize:12,fontWeight:"700"},
  messageActions:{flexDirection:"row",gap:15,marginTop:10,borderTopWidth:1,borderTopColor:"#E8ECE9",paddingTop:7},
  actionText:{color:"#278653",fontSize:12,fontWeight:"700"},regenerate:{alignSelf:"flex-start",marginLeft:35,marginBottom:15,padding:8},
  typing:{flexDirection:"row",alignItems:"center",gap:8,marginBottom:12},typingBubble:{flexDirection:"row",alignItems:"center",gap:9,backgroundColor:"#F5F6F5",paddingHorizontal:14,paddingVertical:12,borderRadius:18},
  typingText:{color:"#728078",fontSize:13},
  composer:{marginHorizontal:10,marginBottom:4,paddingHorizontal:11,paddingTop:10,paddingBottom:8,borderWidth:1,borderColor:"#E5EBE6",borderRadius:24,backgroundColor:"#FFF",elevation:3,shadowColor:"#17231B",shadowOpacity:.06,shadowRadius:9,shadowOffset:{width:0,height:3}},
  composeRow:{flexDirection:"row",alignItems:"flex-end",gap:8},
  attachButton:{width:39,height:39,borderRadius:20,backgroundColor:"#F0F5F1",alignItems:"center",justifyContent:"center"},
  attachButtonText:{color:"#1F8C53",fontSize:27,lineHeight:30,fontWeight:"500"},
  input:{flex:1,minHeight:40,maxHeight:105,color:"#17231B",fontSize:15,lineHeight:21,textAlignVertical:"center",paddingTop:8,paddingBottom:6},
  composerFooter:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:6,paddingLeft:3,gap:8},
  hint:{color:"#9AA39D",fontSize:9,flex:1,textAlign:"right"},
  toolsLink:{color:"#218B55",fontSize:12,fontWeight:"800"},
  sendButton:{width:39,height:39,borderRadius:20,backgroundColor:"#1F8C53",alignItems:"center",justifyContent:"center"},
  sendDisabled:{backgroundColor:"#AAB8AE"},sendIcon:{color:"#FFF",fontSize:25,fontWeight:"800",marginTop:-2},
  attachmentPreview:{flexDirection:"row",alignItems:"center",gap:10,marginBottom:9,padding:7,borderRadius:14,backgroundColor:"#F4F7F4"},
  attachmentThumb:{width:44,height:44,borderRadius:9},
  fileGlyph:{width:44,height:44,borderRadius:9,backgroundColor:"#DDECE1",alignItems:"center",justifyContent:"center"},
  fileGlyphText:{fontSize:11,color:"#23623C",fontWeight:"900"},
  attachmentInfo:{flex:1},attachmentName:{fontSize:12,color:"#24372B",fontWeight:"700"},attachmentType:{fontSize:10,color:"#7B877F",marginTop:3},
  removeAttachment:{width:28,height:28,borderRadius:14,backgroundColor:"#E7ECE8",alignItems:"center",justifyContent:"center"},
  removeAttachmentText:{fontSize:20,color:"#45534A",lineHeight:23},
  page:{flex:1,padding:18},pageTitle:{fontSize:23,fontWeight:"900",color:"#17231B",marginBottom:8},pageSub:{fontSize:13,color:"#7B877F",marginBottom:15},
  search:{borderWidth:1,borderColor:"#E5EBE6",borderRadius:13,paddingHorizontal:14,paddingVertical:11,color:"#17231B",marginVertical:12},
  chatCard:{flexDirection:"row",alignItems:"center",gap:8,padding:14,borderWidth:1,borderColor:"#E8EEE9",borderRadius:15,marginBottom:9},
  chatTitle:{fontSize:14,fontWeight:"800",color:"#24372B"},chatPreview:{fontSize:11,color:"#7B877F",marginTop:4},smallAction:{padding:8},emptyText:{textAlign:"center",color:"#7B877F",marginTop:30},
  primaryButton:{backgroundColor:"#1F8C53",padding:15,borderRadius:14,alignItems:"center",marginTop:10},primaryButtonText:{color:"#FFF",fontWeight:"800"},
  toolGrid:{flexDirection:"row",flexWrap:"wrap",gap:10,paddingVertical:12},toolCard:{width:"48%",minHeight:125,borderWidth:1,borderColor:"#E5EBE6",borderRadius:16,padding:13,backgroundColor:"#FFF"},
  toolIcon:{fontSize:25,marginBottom:9},toolTitle:{fontSize:13,fontWeight:"800",color:"#24372B"},toolHint:{fontSize:10,color:"#278653",marginTop:8},
  bottomNav:{height:60,borderTopWidth:1,borderTopColor:"#EEF1EE",flexDirection:"row",justifyContent:"space-around",alignItems:"center"},
  navItem:{alignItems:"center",justifyContent:"center",minWidth:70},navIcon:{fontSize:20,color:"#218B55"},navText:{fontSize:10,color:"#728078",marginTop:2},
  drawerRoot:{flex:1,flexDirection:"row",backgroundColor:"rgba(0,0,0,0.28)"},
  drawerShade:{position:"absolute",top:0,bottom:0,left:0,right:0},
  drawerPanel:{width:"84%",maxWidth:340,height:"100%",backgroundColor:"#FFF",paddingHorizontal:17,paddingTop:Platform.OS==="android"?38:52,paddingBottom:22,elevation:12},
  drawerTop:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",paddingBottom:20,borderBottomWidth:1,borderBottomColor:"#EEF1EE"},
  drawerBrand:{flexDirection:"row",alignItems:"center",gap:10},drawerAvatar:{width:39,height:39,borderRadius:20},drawerTitle:{fontSize:22,fontWeight:"900",color:"#17231B",letterSpacing:1},
  drawerClose:{width:34,height:34,borderRadius:17,backgroundColor:"#F1F5F2",alignItems:"center",justifyContent:"center"},
  drawerCloseText:{fontSize:22,color:"#27372C",lineHeight:24},
  drawerAction:{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:15,paddingHorizontal:13,backgroundColor:"#EAF5ED",borderRadius:13,marginTop:18,marginBottom:10},
  drawerActionIcon:{fontSize:22,color:"#218B55"},drawerActionText:{fontSize:14,fontWeight:"800",color:"#245B3B"},
  drawerItem:{flexDirection:"row",alignItems:"center",gap:13,paddingVertical:12,paddingHorizontal:10},
  drawerItemIcon:{fontSize:20,color:"#2C6844",width:24,textAlign:"center"},drawerItemText:{fontSize:14,fontWeight:"600",color:"#26372C"},
  drawerSection:{fontSize:11,fontWeight:"800",letterSpacing:1,color:"#87938A",marginTop:20,marginBottom:8,paddingHorizontal:10},
  drawerRecent:{flex:1},drawerChat:{paddingVertical:11,paddingHorizontal:10,borderRadius:10},drawerChatText:{fontSize:13,color:"#39483D"},
  drawerFooter:{fontSize:10,color:"#9AA39D",fontWeight:"700",letterSpacing:1,marginTop:12,paddingHorizontal:10}
});
