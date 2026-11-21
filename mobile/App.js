
import React, { useState } from "react";
import {
  SafeAreaView,
  StatusBar,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert
} from "react-native";

function DynexRobot() {
  return (
    <View style={styles.glow}>
      <View style={styles.robot}>
        <View style={styles.head}>
          <View style={styles.eyes}>
            <View style={styles.eye} />
            <View style={styles.eye} />
          </View>
        </View>
        <View style={styles.body}>
          <Text style={styles.robotD}>D</Text>
        </View>
        <View style={styles.base} />
      </View>
    </View>
  );
}

export default function App() {
  const [message, setMessage] = useState("");

  function sendMessage() {
    if (!message.trim()) return;
    Alert.alert(
      "DYNEX BOT",
      "Your message has been entered. AI connection will be added in the next development stage."
    );
    setMessage("");
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8F9F6" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.darkCircle}>
            <Text style={styles.headerIcon}>☰</Text>
          </TouchableOpacity>

          <Text style={styles.brand}>
            DYNEX <Text style={styles.green}>BOT</Text>
          </Text>

          <TouchableOpacity style={styles.darkCircle}>
            <Text style={styles.headerIcon}>⋮</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <DynexRobot />
            <Text style={styles.title}>Hello, I'm DYNEX</Text>
            <Text style={styles.subtitle}>
              Your intelligent AI assistant. What can I help you with today?
            </Text>
          </View>

          <Text style={styles.sectionTitle}>Recently updated</Text>

          <TouchableOpacity style={styles.history}>
            <View style={styles.checkCircle}>
              <Text style={styles.check}>✓</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.historyTitle}>Welcome to DYNEX BOT</Text>
              <Text style={styles.historySub}>Start a new conversation</Text>
            </View>
            <Text style={styles.more}>⋮</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Ask anything..."
            placeholderTextColor="#858B85"
            multiline
            style={styles.input}
          />

          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.control}
              onPress={() => Alert.alert("DYNEX", "Attachments coming later.")}
            >
              <Text style={styles.controlText}>＋</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.model}
              onPress={() => Alert.alert("DYNEX", "Model options coming later.")}
            >
              <Text style={styles.modelText}>Model</Text>
            </TouchableOpacity>

            <View style={{ flex: 1 }} />

            <TouchableOpacity style={styles.control}>
              <Text style={styles.controlText}>⌘</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.control}>
              <Text style={styles.controlText}>♩</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.send} onPress={sendMessage}>
              <Text style={styles.sendText}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F8F9F6" },
  container: { flex: 1 },
  header: {
    height: 68,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  darkCircle: {
    width: 43,
    height: 43,
    borderRadius: 25,
    backgroundColor: "#151C17",
    alignItems: "center",
    justifyContent: "center"
  },
  headerIcon: { color: "#FFFFFF", fontSize: 23 },
  brand: { fontSize: 20, fontWeight: "900", color: "#172019" },
  green: { color: "#20A847" },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 190 },
  hero: { alignItems: "center", paddingTop: 65, paddingBottom: 65 },
  glow: {
    width: 170,
    height: 170,
    borderRadius: 90,
    backgroundColor: "#DDF6E2",
    borderWidth: 2,
    borderColor: "#8CE99F",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 27,
    elevation: 9
  },
  robot: {
    width: 145,
    height: 145,
    borderRadius: 75,
    backgroundColor: "#07160C",
    borderWidth: 3,
    borderColor: "#36DB60",
    alignItems: "center",
    justifyContent: "center"
  },
  head: {
    width: 88,
    height: 69,
    borderRadius: 23,
    backgroundColor: "#25382A",
    borderWidth: 3,
    borderColor: "#9AB6A0",
    alignItems: "center",
    justifyContent: "center"
  },
  eyes: {
    width: 69,
    height: 43,
    borderRadius: 14,
    backgroundColor: "#020704",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly"
  },
  eye: {
    width: 9,
    height: 20,
    borderRadius: 8,
    backgroundColor: "#59FF78",
    elevation: 8
  },
  body: {
    width: 100,
    height: 49,
    marginTop: -2,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#304A36",
    borderWidth: 2,
    borderColor: "#83A98B",
    alignItems: "center",
    justifyContent: "center"
  },
  robotD: { color: "#68FF86", fontSize: 27, fontWeight: "900" },
  base: {
    width: 75,
    height: 5,
    borderRadius: 5,
    backgroundColor: "#63F77D",
    marginTop: 3
  },
  title: {
    fontSize: 29,
    fontWeight: "900",
    color: "#202820",
    textAlign: "center"
  },
  subtitle: {
    fontSize: 16,
    color: "#777F77",
    lineHeight: 24,
    textAlign: "center",
    marginTop: 10,
    maxWidth: 320
  },
  sectionTitle: {
    fontSize: 22,
    color: "#707970",
    fontWeight: "800",
    marginBottom: 17
  },
  history: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center"
  },
  checkCircle: {
    width: 40,
    height: 40,
    borderRadius: 25,
    backgroundColor: "#E8F5EA",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12
  },
  check: { color: "#218A42", fontSize: 23 },
  historyTitle: { fontSize: 15, fontWeight: "800", color: "#242B25" },
  historySub: { fontSize: 12, color: "#899089", marginTop: 5 },
  more: { fontSize: 25, color: "#777F77" },
  composer: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    minHeight: 145,
    backgroundColor: "#FFFFFF",
    borderRadius: 27,
    padding: 19,
    elevation: 9
  },
  input: {
    minHeight: 65,
    maxHeight: 100,
    fontSize: 20,
    color: "#202820",
    textAlignVertical: "top"
  },
  controls: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  control: {
    width: 37,
    height: 40,
    alignItems: "center",
    justifyContent: "center"
  },
  controlText: { fontSize: 25, color: "#283129" },
  model: {
    backgroundColor: "#F0F0ED",
    borderRadius: 25,
    paddingVertical: 9,
    paddingHorizontal: 15,
    marginLeft: 5
  },
  modelText: { fontSize: 16, fontWeight: "800", color: "#29312A" },
  send: {
    width: 43,
    height: 43,
    borderRadius: 25,
    backgroundColor: "#101A13",
    alignItems: "center",
    justifyContent: "center"
  },
  sendText: { color: "#FFFFFF", fontSize: 26, fontWeight: "900" }
});
