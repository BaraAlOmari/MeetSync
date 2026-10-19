import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from 'expo-camera';
import { auth, db } from "../firebaseConfig";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
} from "firebase/firestore";

export default function MeetingJoinScreen({ onBack, onSubmit, meetingId }) {
  const [meetingLink, setMeetingLink] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [meetingDetails, setMeetingDetails] = useState(null);
  const [pendingMeetingId, setPendingMeetingId] = useState(null);

  useEffect(() => {
    if (meetingId) {
      setMeetingLink(meetingId);
      handleJoin(meetingId);
    }
  }, [meetingId]);

  const extractMeetingId = (input) => {
    if (!input) return null;

    const trimmed = input.trim();

    // Try custom scheme: meetsync://meeting/ID
    const customMatch = trimmed.match(/meetsync:\/\/meeting\/([^\/\s?]+)/);
    if (customMatch) return customMatch[1];

    // Try path only: meeting/ID or /meeting/ID
    const pathMatch = trimmed.match(/\/?meeting\/([^\/\s?]+)/);
    if (pathMatch) return pathMatch[1];

    // Otherwise, treat as direct meeting ID
    return trimmed;
  };

  const fetchMeetingDetails = async (meetingId) => {
    try {
      const meetingRef = doc(db, "meetings", meetingId);
      const docSnap = await getDoc(meetingRef);

      if (!docSnap.exists()) {
        setError("Meeting not found.");
        return null;
      }

      const data = docSnap.data();
      const current = auth.currentUser;

      if (!current) {
        setError("You must be logged in to join a meeting.");
        return null;
      }

      if (data.ownerUid === current.uid) {
        setError("You are the meeting owner and cannot join with this link.");
        return null;
      }

      if (data.selectedSlot) {
        setError("This meeting cannot be joined anymore.");
        return null;
      }

      if (
        Array.isArray(data.participantIds) &&
        data.participantIds.includes(current.uid)
      ) {
        setError("You are already a participant in this meeting.");
        return null;
      }

      // Fetch owner details
      let ownerName = "Unknown";
      if (data.ownerUid) {
        const ownerSnap = await getDoc(doc(db, "users", data.ownerUid));
        if (ownerSnap.exists()) {
          const ownerData = ownerSnap.data();
          const fullName = `${ownerData.firstName || ""} ${ownerData.lastName || ""}`.trim();
          ownerName = fullName || ownerData.email || "Unknown";
        }
      }

      return {
        id: meetingId,
        ...data,
        ownerName,
      };
    } catch (e) {
      console.error("Fetch error:", e);
      setError("Could not fetch meeting details. Please try again.");
      return null;
    }
  };

  const handleJoin = async (input = meetingLink) => {
    const meetingId = extractMeetingId(input);

    if (!meetingId) {
      setError("Please enter a valid meeting link or scan a QR code.");
      return;
    }

    console.log('Attempting to join meeting:', meetingId);

    const current = auth.currentUser;
    if (!current) {
      setError("You must be logged in to join a meeting.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const details = await fetchMeetingDetails(meetingId);
      if (details) {
        setMeetingDetails(details);
        setPendingMeetingId(meetingId);
        setShowConfirmation(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const confirmJoinMeeting = async () => {
    if (!pendingMeetingId) return;

    const current = auth.currentUser;
    if (!current) {
      setError("You must be logged in to join a meeting.");
      setShowConfirmation(false);
      return;
    }

    setLoading(true);
    try {
      const meetingRef = doc(db, "meetings", pendingMeetingId);

      // Get participant name
      let name = current.displayName || "";
      const userSnap = await getDoc(doc(db, "users", current.uid));
      if (userSnap.exists()) {
        const u = userSnap.data();
        const full = `${u.firstName || ""} ${u.lastName || ""}`.trim();
        name = full || name;
      }
      if (!name) name = current.email || "Participant";

      await updateDoc(meetingRef, {
        participantIds: arrayUnion(current.uid),
        participants: arrayUnion({
          uid: current.uid,
          name,
          isGuest: false,
        }),
      });

      setShowConfirmation(false);
      onSubmit && onSubmit(pendingMeetingId);
    } catch (e) {
      console.error("Join error:", e);
      setError("Could not join meeting. Please try again.");
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScanner = async () => {
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes.');
        return;
      }
    }

    setScanned(false);
    setScanning(true);
  };

  const handleBarCodeScanned = ({ data }) => {
    if (scanned) return;

    setScanned(true);
    setScanning(false);
    setMeetingLink(data);
    handleJoin(data);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
    return `${dateStr} (${weekday})`;
  };

  if (scanning) {
    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setScanning(false)} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={28} color="#7a7a7a" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Scan QR Code</Text>
        </View>
        <View style={styles.divider} />

        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{
              barcodeTypes: ["qr"],
            }}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerText}>Position QR code within the frame</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => setScanning(false)}
          style={styles.cancelScanBtn}
          accessibilityLabel="Cancel scanning"
        >
          <Text style={styles.cancelScanText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

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
        Scan a QR code or paste a meeting link to join
      </Text>

      <View style={styles.divider} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          {/* QR Scanner Button */}
          <TouchableOpacity
            onPress={handleOpenScanner}
            style={styles.qrScanBtn}
            accessibilityLabel="Scan QR Code"
          >
            <Ionicons name="qr-code" size={48} color="#08a6c2" />
            <Text style={styles.qrScanText}>Scan QR Code</Text>
          </TouchableOpacity>

          <View style={styles.orContainer}>
            <View style={styles.orLine} />
            <Text style={styles.orText}>OR</Text>
            <View style={styles.orLine} />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Meeting Link</Text>
            <TextInput
              value={meetingLink}
              onChangeText={(t) => {
                setMeetingLink(t);
                if (error) setError("");
              }}
              placeholder="Paste meeting link here"
              placeholderTextColor="#9aa0a6"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={() => handleJoin()}
              multiline={false}
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <TouchableOpacity
            onPress={loading ? undefined : () => handleJoin()}
            style={styles.primaryBtn}
            accessibilityLabel="Join Meeting"
          >
            <Text style={styles.primaryBtnText}>
              {loading ? "Loading..." : "Join"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.help}>
          Don&apos;t have a link? Create your own meeting and share it with others.
        </Text>
      </KeyboardAvoidingView>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmation}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowConfirmation(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="calendar" size={40} color="#08a6c2" />
              <Text style={styles.modalTitle}>Join Meeting?</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {meetingDetails && (
                <View style={styles.detailsContainer}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Meeting Title:</Text>
                    <Text style={styles.detailItemValue}>
                      {meetingDetails.title || "Untitled"}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Organized by:</Text>
                    <Text style={styles.detailItemValue}>
                      {meetingDetails.ownerName}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Date:</Text>
                    <Text style={styles.detailItemValue}>
                      {formatDate(meetingDetails.date)}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Duration:</Text>
                    <Text style={styles.detailItemValue}>
                      {meetingDetails.duration || "-"}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Time Flexibility:</Text>
                    <Text style={styles.detailItemValue}>
                      {meetingDetails.timeFlex || "-"}
                    </Text>
                  </View>

                  {meetingDetails.recurring && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailItemLabel}>Recurring:</Text>
                      <Text style={styles.detailItemValue}>Weekly</Text>
                    </View>
                  )}

                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>Type:</Text>
                    <Text
                      style={[
                        styles.detailItemValue,
                        meetingDetails.type === "Online" && styles.typeOnline,
                      ]}
                    >
                      {meetingDetails.type || "-"}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailItemLabel}>
                      {meetingDetails.type === "Online" ? "Platform:" : "Location:"}
                    </Text>
                    <Text style={styles.detailItemValue}>
                      {meetingDetails.type === "Online"
                        ? meetingDetails.platform || "-"
                        : meetingDetails.location || "-"}
                    </Text>
                  </View>

                  {Array.isArray(meetingDetails.tags) && meetingDetails.tags.length > 0 && (
                    <View style={styles.detailItem}>
                      <Text style={styles.detailItemLabel}>Tags:</Text>
                      <View style={styles.tagsRow}>
                        {meetingDetails.tags.map((tag) => (
                          <View key={tag} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setShowConfirmation(false);
                  setPendingMeetingId(null);
                  setMeetingDetails(null);
                }}
                style={styles.cancelButton}
                accessibilityLabel="Cancel"
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={confirmJoinMeeting}
                style={styles.confirmButton}
                accessibilityLabel="Confirm join"
                disabled={loading}
              >
                <Text style={styles.confirmButtonText}>
                  {loading ? "Joining..." : "Join Meeting"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  qrScanBtn: {
    backgroundColor: "#e0f7fb",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#08a6c2",
    borderStyle: 'dashed',
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  qrScanText: {
    color: "#08a6c2",
    fontSize: 16,
    fontFamily: "LexendDeca_700Bold",
    marginTop: 8,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  orText: {
    marginHorizontal: 16,
    color: '#9aa0a6',
    fontFamily: "LexendDeca_700Bold",
    fontSize: 14,
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
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: '#08a6c2',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  scannerText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: "LexendDeca_700Bold",
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  cancelScanBtn: {
    backgroundColor: "#d32f2f",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginVertical: 15,
    marginBottom: 40,
  },
  cancelScanText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "LexendDeca_700Bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: "LexendDeca_700Bold",
    color: "#424242",
    marginTop: 12,
  },
  detailsContainer: {
    marginBottom: 20,
  },
  detailItem: {
    marginBottom: 8,
  },
  detailItemLabel: {
    fontSize: 14,
    fontFamily: "LexendDeca_700Bold",
    color: "#7a7a7a",
    marginBottom: 4,
  },
  detailItemValue: {
    fontSize: 16,
    fontFamily: "LexendDeca_400Regular",
    color: "#424242",
  },
  typeOnline: {
    color: "#08a6c2",
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  tag: {
    backgroundColor: "#08a6c2",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: "#fff",
    fontFamily: "LexendDeca_700Bold",
    fontSize: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 10
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "#e9ecef",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    color: "#5f6f7a",
    fontSize: 16,
    fontFamily: "LexendDeca_700Bold",
  },
  confirmButton: {
    flex: 1,
    backgroundColor: "#08a6c2",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "LexendDeca_700Bold",
  },
});