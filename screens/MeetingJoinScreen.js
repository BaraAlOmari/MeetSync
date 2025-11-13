import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MeetingJoinScreen({ onBack, onSubmit }) {
  const [meetingId, setMeetingId] = useState("");

  const handleJoin = () => {
    if (!meetingId.trim()) return;
    onSubmit && onSubmit(meetingId.trim());
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={28} color="#7a7a7a" />
          </TouchableOpacity>
        ) : null}
        <Text style={styles.pageTitle}>Join a Meeting</Text>
      </View>

      <View style={styles.divider} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Meeting ID</Text>
            <TextInput
              value={meetingId}
              onChangeText={setMeetingId}
              placeholder="Enter meeting ID"
              placeholderTextColor="#9aa0a6"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleJoin}
            />
          </View>

          <TouchableOpacity
            onPress={handleJoin}
            style={styles.primaryBtn}
            accessibilityLabel="Join Meeting"
          >
            <Text style={styles.primaryBtnText}>Join</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  headerRow: {
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  brand: {
    fontSize: 32,
    fontFamily: "LexendDeca_700Bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
  },
  content: {
    paddingHorizontal: 16,
  },
  pageTitle: {
    color: "#558B97" ,
    fontSize: 18,
    fontFamily: "LexendDeca_700Bold",
    marginHorizontal: 10,
  },
  fieldBlock: {
    marginTop: 12,
  },
  label: {
    color: "#7a7a7a",
    fontFamily: "LexendDeca_700Bold",
    marginBottom: 6,
  },
  input: {
    borderWidth: 0,
    backgroundColor: "#eceff1",
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    color: "#222",
    fontFamily: "LexendDeca_400Regular",
  },
  primaryBtn: {
    backgroundColor: "#08a6c2",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "LexendDeca_700Bold",
  },
});
