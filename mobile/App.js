
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  Pressable,
  StatusBar,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert
} from "react-native";

export default function App() {
  const [message, setMessage] = useState("");

  const notice = (name) => {
    Alert.alert(name, "This feature will be connected in a future update.");
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    Alert.alert(
      "DYNEX Assistant",
      "Your message is ready. The real AI connection is our next development step."
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
        {/* APP HEADER */}
        <View style={styles.header}>
          <Pressable
            style={styles.profileButton}
            onPress={() => notice("Profile")}
          >
            <Image
              source={require("./assets/icon.png")}
              style={styles.profileImage}
            />
          </Pressable>

          <View style={styles.headerCenter}>
            <Pressable
              style={styles.headerButton}
              onPress={() => notice("Search")}
            >
              <Text style={styles.headerIcon}>⌕</Text>
            </Pressable>

            <Pressable
              style={styles.headerButton}
              onPress={() => notice("DYNEX Tools")}
            >
              <Text style={styles.headerIcon}>▣</Text>
            </Pressable>
          </View>

          <Pressable
            style={styles.libraryButton}
            onPress={() => notice("Chat Library")}
          >
            <Text style={styles.headerIcon}>▤</Text>
          </Pressable>
        </View>

        {/* MAIN APP CONTENT */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.hero}>
            <View style={styles.robotWrap}>
              <Image
                source={require("./assets/icon.png")}
                style={styles.robot}
                resizeMode="contain"
              />
              <View style={styles.onlineDot} />
            </View>

            <Text style={styles.heading}>
              Meet DYNEX Assistant
            </Text>

            <Text style={styles.description}>
              Your intelligent companion for thinking, creating,
              learning and getting things done.
            </Text>

            <Pressable
              style={styles.exploreButton}
              onPress={() => notice("Explore DYNEX")}
            >
              <Text style={styles.exploreText}>Explore DYNEX</Text>
            </Pressable>
          </View>

          {/* RECENT CONVERSATIONS */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeading}>
              <Text style={styles.recentTitle}>Recently updated</Text>
              <Pressable onPress={() => notice("See all chats")}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.chatRow}
              onPress={() => notice("Welcome to DYNEX")}
            >
              <View style={styles.chatStatus}>
                <Text style={styles.check}>✓</Text>
              </View>

              <View style={styles.chatInfo}>
                <Text style={styles.chatName}>Welcome to DYNEX</Text>
                <Text style={styles.chatSubtitle}>
                  Start a new conversation
                </Text>
              </View>

              <Text style={styles.chatMore}>⋮</Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* BOTTOM MESSAGE COMPOSER */}
        <View style={styles.composer}>
          <TextInput
            style={styles.messageInput}
            placeholder="Ask anything..."
            placeholderTextColor="#858585"
            value={message}
            onChangeText={setMessage}
            multiline
          />

          <View style={styles.composerActions}>
            <Pressable
              style={styles.actionButton}
              onPress={() => notice("Attachments")}
            >
              <Text style={styles.actionIcon}>＋</Text>
            </Pressable>

            <Pressable
              style={styles.modelButton}
              onPress={() => notice("Choose model")}
            >
              <Text style={styles.modelText}>Model</Text>
            </Pressable>

            <View style={styles.actionSpacer} />

            <Pressable
              style={styles.actionButton}
              onPress={() => notice("AI Tools")}
            >
              <Text style={styles.actionIcon}>⚒</Text>
            </Pressable>

            <Pressable
              style={styles.actionButton}
              onPress={() => notice("Voice input")}
            >
              <Text style={styles.actionIcon}>♩</Text>
            </Pressable>

            <Pressable
              style={styles.sendButton}
              onPress={sendMessage}
            >
              <Text style={styles.sendIcon}>↑</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF"
  },
  header: {
    height: 72,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 25,
    backgroundColor: "#F6F7F5",
    alignItems: "center",
    justifyContent: "center"
  },
  profileImage: {
    width: 31,
    height: 31,
    borderRadius: 16
  },
  headerCenter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 30,
    padding: 5,
    gap: 8
  },
  headerButton: {
    width: 62,
    height: 43,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center"
  },
  headerIcon: {
    color: "#202020",
    fontSize: 25,
    fontWeight: "500"
  },
  libraryButton: {
    width: 48,
    height: 48,
    borderRadius: 25,
    backgroundColor: "#F6F7F5",
    alignItems: "center",
    justifyContent: "center"
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 25
  },
  hero: {
    minHeight: 540,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingTop: 30
  },
  robotWrap: {
    width: 126,
    height: 126,
    marginBottom: 32,
    alignItems: "center",
    justifyContent: "center"
  },
  robot: {
    width: 116,
    height: 116
  },
  onlineDot: {
    position: "absolute",
    right: 9,
    bottom: 12,
    width: 15,
    height: 15,
    borderRadius: 10,
    backgroundColor: "#28B66A",
    borderWidth: 3,
    borderColor: "#FFFFFF"
  },
  heading: {
    fontSize: 27,
    fontWeight: "800",
    color: "#171717",
    textAlign: "center",
    marginBottom: 12
  },
  description: {
    fontSize: 17,
    lineHeight: 27,
    color: "#777777",
    textAlign: "center",
    maxWidth: 330
  },
  exploreButton: {
    backgroundColor: "#171717",
    paddingHorizontal: 30,
    paddingVertical: 13,
    borderRadius: 30,
    marginTop: 25
  },
  exploreText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700"
  },
  recentSection: {
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 15
  },
  recentHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 17
  },
  recentTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#777777"
  },
  seeAll: {
    color: "#29965D",
    fontWeight: "600",
    fontSize: 14
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14
  },
  chatStatus: {
    width: 35,
    height: 35,
    borderRadius: 18,
    backgroundColor: "#EFF8F1",
    alignItems: "center",
    justifyContent: "center"
  },
  check: {
    color: "#26965A",
    fontSize: 18,
    fontWeight: "800"
  },
  chatInfo: {
    flex: 1,
    marginLeft: 13
  },
  chatName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#202020"
  },
  chatSubtitle: {
    fontSize: 12,
    color: "#999999",
    marginTop: 4
  },
  chatMore: {
    fontSize: 24,
    color: "#777777",
    paddingHorizontal: 8
  },
  composer: {
    marginHorizontal: 13,
    marginBottom: 9,
    paddingHorizontal: 17,
    paddingTop: 17,
    paddingBottom: 12,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    elevation: 5,
    shadowColor: "#000000",
    shadowOpacity: 0.07,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 }
  },
  messageInput: {
    minHeight: 52,
    maxHeight: 105,
    fontSize: 19,
    fontWeight: "600",
    color: "#222222",
    textAlignVertical: "top"
  },
  composerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10
  },
  actionButton: {
    width: 39,
    height: 39,
    alignItems: "center",
    justifyContent: "center"
  },
  actionIcon: {
    fontSize: 25,
    color: "#252525"
  },
  modelButton: {
    backgroundColor: "#F1F1F1",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20
  },
  modelText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#333333"
  },
  actionSpacer: {
    flex: 1
  },
  sendButton: {
    width: 41,
    height: 41,
    borderRadius: 22,
    backgroundColor: "#202020",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 5
  },
  sendIcon: {
    color: "#FFFFFF",
    fontSize: 25,
    fontWeight: "700"
  }
});
          
