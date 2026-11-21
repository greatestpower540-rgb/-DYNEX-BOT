
import React, { useState, useRef, useEffect } from "react";
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
  Animated,
} from "react-native";

export default function App() {
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [showTools, setShowTools] = useState(false);

  const robotFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(robotFloat, {
          toValue: -9,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(robotFloat, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();
    return () => animation.stop();
  }, [robotFloat]);

  const comingSoon = (feature) => {
    Alert.alert(
      "DYNEX BOT",
      feature + " is being prepared for a future update."
    );
  };

  const sendMessage = () => {
    if (!message.trim()) {
      Alert.alert("DYNEX BOT", "Enter a message first.");
      return;
    }

    Alert.alert(
      "DYNEX BOT",
      "Your message is ready. The real AI connection will be added next."
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
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => comingSoon("Profile")}
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
                placeholderTextColor="#888888"
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

        {/* TOOLS PANEL */}
        {showTools && (
          <View style={styles.toolsPanel}>
            <Text style={styles.toolsTitle}>DYNEX AI TOOLS</Text>

            <TouchableOpacity onPress={() => comingSoon("AI tools")}>
              <Text style={styles.toolsOption}>
                Explore AI tools →
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => comingSoon("Image creation")}>
              <Text style={styles.toolsOption}>
                Image creation
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => comingSoon("Writing assistant")}>
              <Text style={styles.toolsOption}>
                Writing assistant
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MAIN SCREEN */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ROBOT INTRODUCTION */}
          <View style={styles.intro}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => comingSoon("Introduction")}
            >
              <Text style={styles.closeText}>×</Text>
            </TouchableOpacity>

            <Animated.View
              style={[
                styles.robotFrame,
                {
                  transform: [{ translateY: robotFloat }],
                },
              ]}
            >
              <View style={styles.robotGlow}>
                <Image
                  source={require("./assets/icon.png")}
                  style={styles.robotImage}
                  resizeMode="cover"
                />
              </View>
            </Animated.View>

            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>DYNEX IS READY</Text>
            </View>

            <Text style={styles.introTitle}>
              Meet DYNEX Assistant
            </Text>

            <Text style={styles.introDescription}>
              Your intelligent companion for thinking, creating,
              learning and getting things done.
            </Text>

            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => comingSoon("DYNEX Explore")}
            >
              <Text style={styles.exploreText}>Explore DYNEX →</Text>
            </TouchableOpacity>
          </View>

          {/* RECENT ACTIVITY */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>
                Recently updated
              </Text>

              <TouchableOpacity
                onPress={() => comingSoon("Conversation history")}
              >
                <Text style={styles.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.recentItem}
              onPress={() => comingSoon("Recent conversations")}
            >
              <View style={styles.checkCircle}>
                <Text style={styles.checkText}>✦</Text>
              </View>

              <View style={styles.recentDetails}>
                <Text style={styles.recentName}>
                  Welcome to DYNEX
                </Text>
                <Text style={styles.recentDate}>
                  Start your first conversation
                </Text>
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
            placeholderTextColor="#888888"
            value={message}
            onChangeText={setMessage}
            multiline
          />

          <View style={styles.composerControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => comingSoon("File attachments")}
            >
              <Text style={styles.plusIcon}>＋</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modelButton}
              onPress={() => comingSoon("Model selection")}
            >
              <Text style={styles.modelText}>Model</Text>
              <Text style={styles.modelArrow}>⌄</Text>
            </TouchableOpacity>

            <View style={styles.controlSpacer} />

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowTools(!showTools)}
            >
              <Text style={styles.toolIcon}>⚙</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => comingSoon("Microphone")}
            >
              <Text style={styles.micIcon}>♩</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.voiceButton}
              onPress={() => comingSoon("DYNEX Voice")}
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
    height: 78,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 9,
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F1F9F2",
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  searchGroup: {
    flex: 1,
    height: 52,
    backgroundColor: "#F5F5F5",
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    padding: 4,
  },
  searchBox: {
    flex: 1,
    height: 44,
    backgroundColor: "#FFFFFF",
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  searchIcon: {
    fontSize: 27,
    color: "#333333",
    marginRight: 5,
  },
  searchInput: {
    flex: 1,
    color: "#222222",
    fontSize: 15,
  },
  toolsSwitch: {
    width: 42,
    alignItems: "center",
  },
  switchIcon: {
    fontSize: 22,
    color: "#333333",
  },
  libraryButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  libraryIcon: {
    fontSize: 25,
    color: "#222222",
  },
  toolsPanel: {
    marginHorizontal: 18,
    marginBottom: 8,
    padding: 16,
    backgroundColor: "#F0FAF2",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "#D5F0D9",
  },
  toolsTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#078D2B",
    marginBottom: 8,
  },
  toolsOption: {
    color: "#252525",
    fontSize: 15,
    paddingVertical: 7,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 18,
    justifyContent: "space-between",
  },
  intro: {
    alignItems: "center",
    paddingTop: 65,
    paddingBottom: 48,
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    right: 4,
    top: 35,
    padding: 8,
  },
  closeText: {
    fontSize: 25,
    color: "#777777",
  },
  robotFrame: {
    width: 132,
    height: 132,
    borderRadius: 66,
    padding: 5,
    backgroundColor: "#E7F9E9",
    borderWidth: 2,
    borderColor: "#A9EAB5",
    marginBottom: 22,
    shadowColor: "#0DBA42",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.23,
    shadowRadius: 15,
    elevation: 6,
  },
  robotGlow: {
    flex: 1,
    borderRadius: 60,
    overflow: "hidden",
    backgroundColor: "#E4F9E8",
  },
  robotImage: {
    width: "100%",
    height: "100%",
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 7,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#08B83D",
  },
  onlineText: {
    color: "#08A535",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
  introTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#202020",
    textAlign: "center",
    marginBottom: 12,
  },
  introDescription: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: "500",
    color: "#777777",
    textAlign: "center",
    paddingHorizontal: 8,
  },
  exploreButton: {
    backgroundColor: "#111111",
    paddingHorizontal: 26,
    paddingVertical: 13,
    borderRadius: 28,
    marginTop: 23,
  },
  exploreText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  recentSection: {
    marginTop: 15,
    marginBottom: 10,
  },
  recentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 17,
  },
  recentTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#777777",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "700",
    color: "#07942E",
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  checkCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECF8EF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  checkText: {
    color: "#07942E",
    fontSize: 20,
    fontWeight: "800",
  },
  recentDetails: {
    flex: 1,
  },
  recentName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222222",
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
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 9,
    backgroundColor: "#FFFFFF",
    borderRadius: 26,
    paddingHorizontal: 16,
    paddingTop: 15,
    paddingBottom: 12,
    minHeight: 125,
    borderWidth: 1,
    borderColor: "#EEEEEE",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 13,
    elevation: 6,
  },
  messageInput: {
    fontSize: 19,
    fontWeight: "600",
    color: "#222222",
    minHeight: 45,
    maxHeight: 80,
    textAlignVertical: "top",
  },
  composerControls: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 7,
  },
  controlButton: {
    width: 33,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  plusIcon: {
    fontSize: 28,
    color: "#222222",
  },
  modelButton: {
    backgroundColor: "#F1F0EE",
    borderRadius: 23,
    paddingHorizontal: 13,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  modelText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#333333",
  },
  modelArrow: {
    color: "#555555",
    fontSize: 15,
  },
  controlSpacer: {
    flex: 1,
  },
  toolIcon: {
    fontSize: 21,
    color: "#333333",
  },
  micIcon: {
    fontSize: 24,
    color: "#333333",
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 21,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceIcon: {
    fontSize: 20,
    color: "#FFFFFF",
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 21,
    backgroundColor: "#08B83D",
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: {
    fontSize: 26,
    color: "#FFFFFF",
    fontWeight: "800",
  },
});
                
