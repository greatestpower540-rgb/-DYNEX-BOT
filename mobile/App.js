
import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  StyleSheet,
} from "react-native";

export default function App() {
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showTools, setShowTools] = useState(false);

  const comingSoon = (feature) => {
    Alert.alert("DYNEX BOT", feature + " will be activated in a future update.");
  };

  const sendMessage = () => {
    if (!message.trim()) return;

    Alert.alert(
      "DYNEX BOT",
      "Your message is ready. The secure AI connection is the next development stage."
    );
    setMessage("");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* TOP HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => comingSoon("Your profile")}
          >
            <Image
              source={require("./assets/icon.png")}
              style={styles.profileImage}
            />
          </TouchableOpacity>

          <View style={styles.searchGroup}>
            <View style={styles.searchBox}>
              <Text style={styles.searchIcon}>⌕</Text>
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search"
                placeholderTextColor="#777777"
                style={styles.searchInput}
              />
            </View>

            <TouchableOpacity
              style={styles.toolsSwitch}
              onPress={() => setShowTools(!showTools)}
            >
              <Text style={styles.switchIcon}>▣</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.libraryButton}
            onPress={() => comingSoon("Chat library")}
          >
            <Text style={styles.libraryIcon}>▤</Text>
          </TouchableOpacity>
        </View>

        {showTools && (
          <View style={styles.toolsPanel}>
            <Text style={styles.toolsTitle}>DYNEX AI TOOLS</Text>
            <TouchableOpacity onPress={() => comingSoon("AI tools")}>
              <Text style={styles.toolsOption}>Explore available tools →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MAIN CONTENT */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* INTRODUCTION */}
          <View style={styles.intro}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => comingSoon("Introduction")}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>

            <View style={styles.robotFrame}>
              <Image
                source={require("./assets/icon.png")}
                style={styles.robotImage}
                resizeMode="cover"
              />
            </View>

            <Text style={styles.introTitle}>
              Introducing DYNEX Assistant
            </Text>

            <Text style={styles.introDescription}>
              Your intelligent companion for thinking, creating and getting
              things done.
            </Text>

            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => comingSoon("DYNEX Explore")}
            >
              <Text style={styles.exploreText}>Explore</Text>
            </TouchableOpacity>
          </View>

          {/* RECENT CONVERSATIONS */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recently updated</Text>
              <TouchableOpacity onPress={() => comingSoon("All conversations")}>
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.recentItem}
              onPress={() => comingSoon("Recent conversation")}
            >
              <View style={styles.checkCircle}>
                <Text style={styles.checkText}>✓</Text>
              </View>

              <View style={styles.recentDetails}>
                <Text style={styles.recentName}>Welcome to DYNEX</Text>
                <Text style={styles.recentDate}>Start a new conversation</Text>
              </View>

              <TouchableOpacity
                onPress={() => comingSoon("Conversation options")}
              >
                <Text style={styles.moreIcon}>⋮</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* MESSAGE COMPOSER */}
        <View style={styles.composer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Ask anything..."
            placeholderTextColor="#777777"
            value={message}
            onChangeText={setMessage}
            multiline
          />

          <View style={styles.composerControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => comingSoon("Attachments")}
            >
              <Text style={styles.plusIcon}>＋</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modelButton}
              onPress={() => comingSoon("AI model selection")}
            >
              <Text style={styles.modelText}>Model</Text>
            </TouchableOpacity>

            <View style={styles.controlSpacer} />

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => comingSoon("AI tools")}
            >
              <Text style={styles.toolIcon}>⚙</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => comingSoon("Voice input")}
            >
              <Text style={styles.micIcon}>♩</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.voiceButton}
              onPress={() => comingSoon("Voice assistant")}
            >
              <Text style={styles.voiceIcon}>▥</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sendButton}
              onPress={sendMessage}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    height: 82,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  profileButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F5F8F5",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  searchGroup: {
    flex: 1,
    height: 56,
    backgroundColor: "#F7F7F7",
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  searchBox: {
    flex: 1,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  searchIcon: {
    fontSize: 29,
    color: "#222222",
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    color: "#222222",
    fontSize: 15,
  },
  toolsSwitch: {
    width: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  switchIcon: {
    fontSize: 23,
    color: "#333333",
  },
  libraryButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F7F7F7",
    alignItems: "center",
    justifyContent: "center",
  },
  libraryIcon: {
    fontSize: 27,
    color: "#222222",
  },
  toolsPanel: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#F1FAF2",
    borderWidth: 1,
    borderColor: "#D7F2D9",
  },
  toolsTitle: {
    color: "#008D25",
    fontWeight: "800",
    fontSize: 12,
  },
  toolsOption: {
    color: "#222222",
    marginTop: 8,
    fontSize: 15,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
    justifyContent: "space-between",
  },
  intro: {
    alignItems: "center",
    paddingTop: 85,
    paddingBottom: 65,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    right: 5,
    top: 48,
    padding: 8,
  },
  closeText: {
    color: "#777777",
    fontSize: 25,
  },
  robotFrame: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 2,
    borderColor: "#B6EFC0",
    backgroundColor: "#EAFBEA",
    overflow: "hidden",
    marginBottom: 30,
  },
  robotImage: {
    width: "100%",
    height: "100%",
  },
  introTitle: {
    color: "#202020",
    fontSize: 23,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
  },
  introDescription: {
    color: "#777777",
    fontSize: 18,
    lineHeight: 29,
    fontWeight: "600",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  exploreButton: {
    backgroundColor: "#171717",
    paddingHorizontal: 30,
    paddingVertical: 11,
    borderRadius: 28,
    marginTop: 24,
  },
  exploreText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 17,
  },
  recentSection: {
    marginTop: 15,
    marginBottom: 10,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  recentTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#777777",
  },
  seeAll: {
    fontSize: 14,
    color: "#078D2B",
    fontWeight: "700",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  checkCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#EDF8EF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 13,
  },
  checkText: {
    color: "#078D2B",
    fontSize: 19,
    fontWeight: "700",
  },
  recentDetails: {
    flex: 1,
  },
  recentName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#242424",
  },
  recentDate: {
    color: "#999999",
    fontSize: 12,
    marginTop: 4,
  },
  moreIcon: {
    fontSize: 25,
    color: "#777777",
    paddingHorizontal: 8,
  },
  composer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 27,
    paddingHorizontal: 18,
    paddingTop: 17,
    paddingBottom: 12,
    minHeight: 132,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.09,
    shadowRadius: 16,
    elevation: 7,
    borderWidth: 1,
    borderColor: "#F3F3F3",
  },
  messageInput: {
    fontSize: 20,
    fontWeight: "600",
    color: "#222222",
    minHeight: 48,
    maxHeight: 85,
    textAlignVertical: "top",
  },
  composerControls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 9,
  },
  controlButton: {
    width: 35,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  plusIcon: {
    fontSize: 29,
    color: "#222222",
  },
  modelButton: {
    backgroundColor: "#F1EFED",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  modelText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#333333",
  },
  controlSpacer: {
    flex: 1,
  },
  toolIcon: {
    fontSize: 21,
    color: "#333333",
  },
  micIcon: {
    fontSize: 25,
    color: "#333333",
  },
  voiceButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceIcon: {
    fontSize: 21,
    color: "#FFFFFF",
  },
  sendButton: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: "#08B832",
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: {
    fontSize: 27,
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
          
