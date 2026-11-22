import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, Image, TextInput, ScrollView, Pressable, StatusBar,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Keyboard
} from "react-native";

// Set EXPO_PUBLIC_DYNEX_API_URL in the build environment to your deployed Worker /chat URL.
const API_URL = "https://dynex-bot-ai5dcf.destinychukwudi209.workers.dev/chat";

const starter = {
  id: "welcome",
  role: "assistant",
  content: "Hi! I'm DYNEX, your AI assistant. Ask me anything — I can explain ideas, help you write, learn, plan, and solve problems."
};

export default function App() {
  const [messages, setMessages] = useState([starter]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 120);
    return () => clearTimeout(timer);
  }, [messages, busy]);

  const sendMessage = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    if (!API_URL) {
      Alert.alert("Connect DYNEX AI", "The app interface is ready. Deploy the DYNEX AI Worker and replace API_URL in mobile/App.js with your Worker /chat address to enable live replies.");
      return;
    }

    Keyboard.dismiss();
    setDraft("");
    const next = [...messages, { id: String(Date.now()), role: "user", content: text }];
    setMessages(next);
    setBusy(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.filter(item => item.id !== "welcome").slice(-20).map(({ role, content }) => ({ role, content }))
        })
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const detail = data.error || "The AI service returned an error.";
        const status = data.provider_status ? ` (provider status: ${data.provider_status})` : ` (HTTP ${response.status})`;
        throw new Error(detail + status);
      }
      const answer = String(data.reply || "").trim();
      if (!answer) throw new Error("DYNEX returned an empty reply. Please try again.");
      setMessages(current => [...current, { id: String(Date.now() + 1), role: "assistant", content: answer }]);
    } catch (error) {
      const detail = error?.message || "Unknown connection error.";
      setMessages(current => [...current, {
        id: String(Date.now() + 2),
        role: "assistant",
        content: `DYNEX couldn't complete that request: ${detail}`
      }]);
    } finally {
      setBusy(false);
    }
  };

  const clearChat = () => {
    Alert.alert("New chat", "Start a fresh conversation?", [
      { text: "Cancel", style: "cancel" },
      { text: "New chat", onPress: () => setMessages([starter]) }
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <Image source={require("./assets/icon.png")} style={styles.avatar} />
            <View>
              <Text style={styles.brandName}>DYNEX</Text>
              <View style={styles.onlineRow}><View style={styles.onlineDot} /><Text style={styles.onlineText}>AI ASSISTANT</Text></View>
            </View>
          </View>
          <Pressable style={styles.newChat} onPress={clearChat}><Text style={styles.newChatText}>＋</Text></Pressable>
        </View>

        <ScrollView ref={scrollRef} style={styles.chat} contentContainerStyle={styles.chatContent} keyboardShouldPersistTaps="handled">
          {messages.length === 1 && (
            <View style={styles.welcome}>
              <Image source={require("./assets/icon.png")} style={styles.heroRobot} resizeMode="contain" />
              <Text style={styles.welcomeTitle}>What can I help with?</Text>
              <Text style={styles.welcomeSub}>Think clearly. Create freely. Get things done.</Text>
              <View style={styles.suggestions}>
                {["Explain something to me", "Help me write", "Plan my day"].map((item) => (
                  <Pressable key={item} style={styles.suggestion} onPress={() => setDraft(item)}>
                    <Text style={styles.suggestionText}>{item}</Text><Text style={styles.suggestionArrow}>↗</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {messages.map((item) => (
            item.id === "welcome" ? null : (
              <View key={item.id} style={[styles.messageRow, item.role === "user" ? styles.userRow : styles.assistantRow]}>
                {item.role === "assistant" && <Image source={require("./assets/icon.png")} style={styles.messageAvatar} />}
                <View style={[styles.bubble, item.role === "user" ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={[styles.messageText, item.role === "user" ? styles.userText : styles.assistantText]}>{item.content}</Text>
                </View>
              </View>
            )
          ))}
          {busy && <View style={styles.typing}><Image source={require("./assets/icon.png")} style={styles.messageAvatar} /><View style={styles.typingBubble}><ActivityIndicator size="small" color="#218B55" /><Text style={styles.typingText}>DYNEX is thinking…</Text></View></View>}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Message DYNEX..."
            placeholderTextColor="#929A94"
            value={draft}
            onChangeText={setDraft}
            multiline
            maxLength={6000}
            editable={!busy}
            returnKeyType="default"
          />
          <View style={styles.composerBottom}>
            <Text style={styles.hint}>DYNEX can make mistakes. Check important information.</Text>
            <Pressable style={[styles.sendButton, (!draft.trim() || busy) && styles.sendDisabled]} onPress={sendMessage} disabled={!draft.trim() || busy}>
              {busy ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.sendIcon}>↑</Text>}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: { height: 68, paddingHorizontal: 19, borderBottomWidth: 1, borderBottomColor: "#F0F2F0", flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 11 },
  avatar: { width: 43, height: 43, borderRadius: 22, backgroundColor: "#F1F7F2" },
  brandName: { color: "#17231B", fontSize: 18, fontWeight: "900", letterSpacing: 1.1 },
  onlineRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#2BB66A" },
  onlineText: { color: "#7A897E", fontSize: 9, fontWeight: "800", letterSpacing: 1.2 },
  newChat: { width: 42, height: 42, borderRadius: 22, backgroundColor: "#F3F6F3", alignItems: "center", justifyContent: "center" },
  newChatText: { color: "#1E3827", fontSize: 27, lineHeight: 30 },
  chat: { flex: 1 },
  chatContent: { flexGrow: 1, paddingHorizontal: 17, paddingTop: 20, paddingBottom: 24 },
  welcome: { flex: 1, minHeight: 440, alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  heroRobot: { width: 132, height: 132, marginBottom: 20 },
  welcomeTitle: { fontSize: 26, lineHeight: 33, fontWeight: "800", color: "#17231B", textAlign: "center" },
  welcomeSub: { fontSize: 14, color: "#7B877F", marginTop: 8, textAlign: "center" },
  suggestions: { width: "100%", gap: 9, marginTop: 30 },
  suggestion: { minHeight: 49, borderWidth: 1, borderColor: "#E8EEE9", borderRadius: 15, paddingHorizontal: 15, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "#FFFFFF" },
  suggestionText: { color: "#3A4B3F", fontSize: 14, fontWeight: "600" },
  suggestionArrow: { color: "#24935A", fontSize: 18 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 17, gap: 8 },
  userRow: { justifyContent: "flex-end" },
  assistantRow: { justifyContent: "flex-start" },
  messageAvatar: { width: 27, height: 27, borderRadius: 14, marginBottom: 3 },
  bubble: { maxWidth: "84%", borderRadius: 19, paddingHorizontal: 15, paddingVertical: 12 },
  userBubble: { backgroundColor: "#EAF5ED", borderBottomRightRadius: 5 },
  assistantBubble: { backgroundColor: "#F5F6F5", borderBottomLeftRadius: 5 },
  messageText: { fontSize: 15, lineHeight: 23 },
  userText: { color: "#20392A" },
  assistantText: { color: "#202923" },
  typing: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  typingBubble: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#F5F6F5", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 18 },
  typingText: { color: "#728078", fontSize: 13 },
  composer: { marginHorizontal: 12, marginBottom: 10, paddingHorizontal: 15, paddingTop: 13, paddingBottom: 10, borderWidth: 1, borderColor: "#E5EBE6", borderRadius: 23, backgroundColor: "#FFFFFF", elevation: 3, shadowColor: "#17231B", shadowOpacity: 0.06, shadowRadius: 9, shadowOffset: { width: 0, height: 3 } },
  input: { minHeight: 43, maxHeight: 125, color: "#17231B", fontSize: 16, lineHeight: 22, textAlignVertical: "top", paddingTop: 4 },
  composerBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 7 },
  hint: { color: "#9AA39D", fontSize: 9, flex: 1, paddingRight: 8 },
  sendButton: { width: 39, height: 39, borderRadius: 20, backgroundColor: "#1F8C53", alignItems: "center", justifyContent: "center" },
  sendDisabled: { backgroundColor: "#AAB8AE" },
  sendIcon: { color: "#FFFFFF", fontSize: 25, fontWeight: "800", marginTop: -2 }
});
