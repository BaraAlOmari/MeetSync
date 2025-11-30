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
import { auth, db } from "../firebaseConfig";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  arrayUnion,
} from "firebase/firestore";

export default function MeetingJoinScreen({ onBack, onSubmit }) {
  const [meetingId, setMeetingId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    const code = meetingId.trim().toUpperCase();
    if (!code) {
      setError("Please enter a meeting ID.");
      return;
    }

    const current = auth.currentUser;
    if (!current) {
      setError("You must be logged in to join a meeting.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const meetingsRef = collection(db, "meetings");
      const q = query(meetingsRef, where("code", "==", code));
      const snap = await getDocs(q);
      if (snap.empty) {
        setError("Meeting not found.");
        return;
      }

      const docSnap = snap.docs[0];
      const data = docSnap.data();

      if (data.ownerUid === current.uid) {
        setError("You are the meeting owner and cannot join with this code.");
        return;
      }

      if (data.selectedSlot) {
        setError("This meeting cannot be joined anymore.");
        return;
      }

      if (
        Array.isArray(data.participantIds) &&
        data.participantIds.includes(current.uid)
      ) {
        setError("You are already a participant in this meeting.");
        return;
      }

      // Get participant name
      let name = current.displayName || "";
      const userSnap = await getDoc(doc(db, "users", current.uid));
      if (userSnap.exists()) {
        const u = userSnap.data();
        const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
        name = full || name;
      }
      if (!name) name = current.email || "Participant";

      await updateDoc(docSnap.ref, {
        participantIds: arrayUnion(current.uid),
        participants: arrayUnion({
          uid: current.uid,
          name,
          isGuest: false,
        }),
      });

      onSubmit && onSubmit(docSnap.id);
    } catch (e) {
      setError("Could not join meeting. Please try again.");
    } finally {
      setLoading(false);
    }
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

      <Text style={styles.help}>
        Join a meeting using shared meeting code.
      </Text>

      <View style={styles.divider} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Meeting Code</Text>
            <TextInput
              value={meetingId}
              onChangeText={(t) => {
                setMeetingId(t);
                if (error) setError("");
              }}
              placeholder="Enter meeting Code"
              placeholderTextColor="#9aa0a6"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleJoin}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            onPress={loading ? undefined : handleJoin}
            style={styles.primaryBtn}
            accessibilityLabel="Join Meeting"
          >
            <Text style={styles.primaryBtnText}>Join</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.help}>
          Don't have a Code? Create your own meeting and share it with others.
        </Text>
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
    color: "#558B97",
    fontSize: 18,
    fontFamily: "LexendDeca_700Bold",
    marginHorizontal: 10,
  },
  help: {
    marginVertical: 8,
    marginHorizontal: 16,
    color: "#9aa0a6",
    fontFamily: "LexendDeca_400Regular",
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
  errorText: {
    color: "#d32f2f",
    marginTop: 6,
    fontFamily: "LexendDeca_400Regular",
  },
});
