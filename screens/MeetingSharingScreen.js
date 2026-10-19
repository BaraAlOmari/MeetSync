import { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, Share } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebaseConfig";
import { arrayUnion, collection, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";
import QRCode from 'react-native-qrcode-svg';
import { DAY_KEYS, dayKeyOf, weekdayLabel } from "../utils/date";
import { END_HOUR, START_HOUR, recommendSlots } from "../utils/scheduling";

export default function MeetingSharingScreen({ onHome, meeting, onEdit }) {
  const [recommendedSlots, setRecommendedSlots] = useState([]);
  const [participantsList, setParticipantsList] = useState([]);
  const [calcLoading, setCalcLoading] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualAvail, setManualAvail] = useState(() => {
    const initial = {};
    DAY_KEYS.forEach((d) => {
      initial[d] = new Set();
    });
    return initial;
  });
  const [showManualGrid, setShowManualGrid] = useState(false);
  const HOURS = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i
  );
  const [pendingSlot, setPendingSlot] = useState(null);
  const [selectedLabel, setSelectedLabel] = useState(
    meeting?.selectedSlot?.label || ""
  );

  // Generate deep link
  const deepLink = meeting?.id 
    ? `meetsync://meeting/${meeting.id}` 
    : "";

  const handleCancelMeeting = async () => {
    try {
      if (meeting?.id) {
        await deleteDoc(doc(db, "meetings", meeting.id));
      }
    } catch (e) {
    }
    if (onHome) onHome();
  };

  const handleShare = async () => {
    if (!meeting?.id) return;
    
    try {
      const result = await Share.share({
        message: `Join my meeting: ${meeting.title || "Untitled Meeting"}\n\nClick here to join: ${deepLink}`,
        title: 'Share Meeting',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share meeting link');
    }
  };

  async function computeRecommendedFor(currentMeeting) {
    const participants = Array.isArray(currentMeeting?.participants)
      ? currentMeeting.participants
      : [];
    setParticipantsList(participants);

    if (!dayKeyOf(currentMeeting?.date) || participants.length < 2) {
      setRecommendedSlots([]);
      return;
    }

    setCalcLoading(true);
    try {
      // Guests carry their availability on the meeting; users have it on
      // their profile along with the hours they've already booked.
      const schedules = await Promise.all(
        participants.map(async (p) => {
          if (p.isGuest) return { availability: p.availability || {} };
          if (!p.uid) return { availability: {} };
          const snap = await getDoc(doc(db, "users", p.uid));
          const data = snap.exists() ? snap.data() : {};
          return { availability: data.availability || {}, busy: data.busy };
        })
      );
      setRecommendedSlots(recommendSlots(currentMeeting, schedules));
    } catch {
      setRecommendedSlots([]);
    } finally {
      setCalcLoading(false);
    }
  }

  useEffect(() => {
    computeRecommendedFor(meeting);
  }, [meeting]);

  const handleSelectSlot = (slot) => {
    if (!meeting || !meeting.date) return;
    const current = auth.currentUser;
    if (!current || meeting.ownerUid !== current.uid) return;

    if (!meeting.selectedSlot && selectedLabel === slot.label) {
      setPendingSlot(null);
      setSelectedLabel("");
      return;
    }

    setPendingSlot(slot);
    setSelectedLabel(slot.label);
  };

  const toggleManualSlot = (day, hour) => {
    setManualAvail((prev) => {
      const next = { ...prev, [day]: new Set(prev[day]) };
      if (next[day].has(hour)) next[day].delete(hour);
      else next[day].add(hour);
      return next;
    });
  };

  const handleSaveManualParticipant = async () => {
    const name = manualName.trim();
    if (!name) {
      Alert.alert("Missing name", "Please enter the participant name.");
      return;
    }

    const normalized = {};
    DAY_KEYS.forEach((d) => {
      normalized[d] = Array.from(manualAvail[d] || []);
    });
    const hasAny = Object.values(normalized).some(
      (arr) => Array.isArray(arr) && arr.length > 0
    );
    if (!hasAny) {
      Alert.alert(
        "No availability",
        "Please select at least one availability slot."
      );
      return;
    }

    if (!meeting || !meeting.id) return;

    // Guests only exist on this meeting. The id just needs to be unique, so
    // borrow Firestore's generator without writing anything.
    const newParticipant = {
      guestId: doc(collection(db, "meetings")).id,
      name,
      isGuest: true,
      availability: normalized,
    };

    try {
      // arrayUnion so a guest added while someone joins doesn't overwrite them
      await updateDoc(doc(db, "meetings", meeting.id), {
        participants: arrayUnion(newParticipant),
      });
    } catch {
      Alert.alert("Error", "Could not add the participant. Please try again.");
      return;
    }

    const snap = await getDoc(doc(db, "meetings", meeting.id)).catch(() => null);
    const updatedMeeting = snap?.exists()
      ? { ...meeting, ...snap.data() }
      : {
          ...meeting,
          participants: [...(meeting.participants || []), newParticipant],
        };

    setManualName("");
    setManualAvail(() => {
      const initial = {};
      DAY_KEYS.forEach((d) => {
        initial[d] = new Set();
      });
      return initial;
    });
    setShowManualGrid(false);

    await computeRecommendedFor(updatedMeeting);
  };

  const handleConfirmSelection = async () => {
    const current = auth.currentUser;
    if (
      !meeting?.id ||
      !current ||
      meeting.ownerUid !== current.uid ||
      !pendingSlot ||
      !dayKeyOf(meeting.date)
    ) {
      if (onHome) onHome();
      return;
    }

    // Only the meeting changes. Each participant's app picks up the booking
    // and updates their own busy hours (see useBusySync in App.js).
    try {
      await updateDoc(doc(db, "meetings", meeting.id), {
        selectedSlot: {
          label: pendingSlot.label,
          startHour: pendingSlot.startHour,
          dayKey: dayKeyOf(meeting.date),
        },
      });
    } catch {
      Alert.alert("Error", "Could not schedule the meeting. Please try again.");
      return;
    }
    if (onHome) onHome();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.pageTitle}>Share your meeting:</Text>
      </View>
      <View style={styles.divider} />

      <View style={{ paddingHorizontal: 16, paddingTop: 0 }}>
        <Text style={styles.help}>
          Confirm meeting details. And Share meeting with others to view the
          Recommended Time slots.
        </Text>
      </View>
      <View style={styles.divider} />
      <ScrollView style={{ paddingHorizontal: 16, paddingTop: 12, marginBottom: 100 }}>
        {meeting && (
          <View style={styles.card}>
            <View style={styles.meetingHeaderRow}>
              <Text style={styles.meetingTitle}>{meeting.title || "Untitled"}</Text>
              {onEdit && (
                <TouchableOpacity
                  onPress={() => onEdit(meeting)}
                  accessibilityLabel="Edit meeting"
                  style={styles.editIcon}
                >
                  <Ionicons name="create-outline" size={28} color="#08a6c2" />
                </TouchableOpacity>
              )}
            </View>

            {Array.isArray(meeting.tags) && meeting.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {meeting.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date:</Text>
              <Text style={styles.detailValue}>
                {meeting.date
                  ? [meeting.date, weekdayLabel(meeting.date)].filter(Boolean).join(" ")
                  : "-"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration:</Text>
              <Text style={styles.detailValue}>{meeting.duration || "-"}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time Flex:</Text>
              <Text style={styles.detailValue}>{meeting.timeFlex || "-"}</Text>
            </View>

            {meeting.recurring && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Recurring:</Text>
                <Text style={styles.detailValue}>
                  Weekly
                </Text>
              </View>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type:</Text>
              <Text
                style={[
                  styles.detailValue,
                  meeting.type === "Online" && styles.typeOnline,
                ]}
              >
                {meeting.type || "-"}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                {meeting.type === "Online" ? "Platform:" : "Location:"}
              </Text>
              <Text style={styles.detailValue}>
                {meeting.type === "Online"
                  ? meeting.platform || "-"
                  : meeting.location || "-"}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.card, { marginTop: 20, alignItems: 'center' }]}>
          <Text style={styles.title}>Share Meeting</Text>
          
          {/* QR Code */}
          <View style={styles.qrContainer}>
            {deepLink ? (
              <QRCode
                value={deepLink}
                size={200}
                color="#558B97"
                backgroundColor="white"
              />
            ) : (
              <View style={styles.qrPlaceholder}>
                <Text style={styles.emptyText}>No meeting ID available</Text>
              </View>
            )}
          </View>

          {/* Deep Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkLabel}>Meeting Link:</Text>
            <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
              {deepLink || "-"}
            </Text>
          </View>

          {/* Share Button */}
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShare}
            accessibilityLabel="Share meeting link"
          >
            <Ionicons name="share-social" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.shareBtnText}>Share Meeting</Text>
          </TouchableOpacity>

          <View style={{ alignItems: "center", marginTop: 12 }}>
            <Text style={styles.title}>OR</Text>
          </View>
          
          <View style={[styles.card, {width: '100%'}]}>
            <Text style={[styles.meetingTitle, { color: "#558B97" }]}>Add Participants Manually</Text>
            <TextInput
              placeholder="Name"
              placeholderTextColor="#9aa0a6"
              value={manualName}
              onChangeText={setManualName}
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <TouchableOpacity
              style={styles.addParticipantsBtn}
              onPress={() => setShowManualGrid(true)}
            >
              <Text style={styles.addParticipantsBtnText}>Add Availability</Text>
            </TouchableOpacity>

            {showManualGrid && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.manualSubtitle}>Availability</Text>
                <View style={styles.gridHeaderRow}>
                  <View style={styles.timeCol}>
                    <Text style={styles.timeHeaderText}>Time</Text>
                  </View>
                  {DAY_KEYS.map((d) => (
                    <View key={d} style={styles.dayCol}>
                      <Text style={styles.dayText}>{d}</Text>
                    </View>
                  ))}
                </View>

                <ScrollView
                  style={styles.manualGridScroll}
                  showsVerticalScrollIndicator
                  nestedScrollEnabled
                >
                  {HOURS.map((h) => (
                    <View key={h} style={styles.gridRow}>
                      <View style={styles.timeCol}>
                        <Text style={styles.timeLabel}>
                          {String(h).padStart(2, "0")}:00
                        </Text>
                      </View>
                      {DAY_KEYS.map((d) => {
                        const selected =
                          manualAvail[d] && manualAvail[d].has(h);
                        return (
                          <View key={`${d}-${h}`} style={styles.slotCol}>
                            <TouchableOpacity
                              onPress={() => toggleManualSlot(d, h)}
                              style={[
                                styles.slot,
                                selected
                                  ? styles.slotSelected
                                  : styles.slotUnselected,
                              ]}
                              accessibilityLabel={`${d} ${String(
                                h
                              ).padStart(2, "0")}:00`}
                            />
                          </View>
                        );
                      })}
                    </View>
                  ))}
                </ScrollView>

                <TouchableOpacity
                  style={[styles.addParticipantsBtn, { marginTop: 12 }]}
                  onPress={handleSaveManualParticipant}
                  accessibilityLabel="Save manual participant"
                >
                  <Text style={styles.addParticipantsBtnText}>
                    Save Participant
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <View style={[styles.card, { marginVertical: 20, borderColor: "#558B97" }]}>
          <Text style={styles.title}>Recommended Times</Text>
          {participantsList.length > 0 && (
            <Text style={styles.participantsText}>
              Participants: <Text style={styles.participantsName}>{participantsList.map((p) => p.name || "Unknown").join(", ")}</Text>
            </Text>
          )}

          {calcLoading ? (
            <View
              style={[
                styles.card,
                { flexDirection: "row", justifyContent: "center", alignItems: "center" },
              ]}
            >
              <Text style={styles.emptyText}>Calculating recommended times...</Text>
            </View>
          ) : recommendedSlots.length === 0 ? (
            <View
              style={[
                styles.card,
                { flexDirection: "row", justifyContent: "center", alignItems: "center" },
              ]}
            >
              <Text style={styles.emptyText}>
                {participantsList.length < 2
                  ? "You need at least two participants to find recommended times."
                  : "You need participants with availability on this day to find recommended times."}
              </Text>
            </View>
          ) : (
            recommendedSlots.map((slot) => {
              const isSelected =
                meeting?.selectedSlot?.label === slot.label ||
                selectedLabel === slot.label;
              return (
                <TouchableOpacity
                  key={slot.label}
                  style={[
                    styles.recommendedRow,
                    isSelected && styles.recommendedRowSelected,
                  ]}
                  onPress={() => handleSelectSlot(slot)}
                  accessibilityLabel={`Select time slot ${slot.label}`}
                >
                  <Text style={styles.recommendedText}>{slot.label}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        <TouchableOpacity
          style={[styles.card, { borderColor: "#d32f2f", marginBottom: 20, justifyContent: "center", alignItems: "center", paddingVertical: 4 }]}
          onPress={handleCancelMeeting}
          accessibilityLabel="Cancel meeting"
        >
          <Text style={[styles.title, { color: "#d32f2f", fontSize: 16 }]}>Cancel Meeting</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        onPress={handleConfirmSelection}
        style={styles.fab}
        accessibilityLabel="Next"
      >
        <Ionicons name="arrow-forward" size={32} color="#fff" />
      </TouchableOpacity>
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
  pageTitle: {
    color: "#558B97",
    fontSize: 18,
    fontFamily: "LexendDeca_700Bold",
    marginHorizontal: 10,
  },
  title: {
    fontFamily: "LexendDeca_700Bold",
    fontSize: 18,
    color: "#7a7a7a",
    marginVertical: 8
  },
  help: {
    marginVertical: 8,
    color: "#9aa0a6",
    fontFamily: "LexendDeca_400Regular",
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cfd8dc",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#ffffff",
  },
  meetingTitle: {
    fontFamily: "LexendDeca_700Bold",
    fontSize: 16,
    color: "#424242",
    marginBottom: 6,
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  tag: {
    backgroundColor: "#08a6c2",
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
  },
  tagText: {
    color: "#fff",
    fontFamily: "LexendDeca_700Bold",
    fontSize: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  detailLabel: {
    fontFamily: "LexendDeca_700Bold",
    color: "#7a7a7a",
    marginRight: 8,
  },
  detailValue: {
    fontFamily: "LexendDeca_400Regular",
    color: "#555",
  },
  typeOnline: {
    color: "#08a6c2",
  },
  fab: {
    position: "absolute",
    right: 24,
    bottom: 24,
    width: 64,
    height: 64,
    borderRadius: 40,
    backgroundColor: "#08a6c2",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  meetingHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  editIcon: {
    paddingLeft: 8,
    paddingVertical: 4,
  },
  qrContainer: {
    marginVertical: 16,
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  qrPlaceholder: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
  },
  linkContainer: {
    width: '100%',
    marginVertical: 12,
    paddingHorizontal: 8,
  },
  linkLabel: {
    fontFamily: "LexendDeca_700Bold",
    fontSize: 14,
    color: "#7a7a7a",
    marginBottom: 6,
  },
  linkText: {
    fontFamily: "LexendDeca_400Regular",
    fontSize: 12,
    color: "#558B97",
    textAlign: 'center',
  },
  shareBtn: {
    backgroundColor: "#08a6c2",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    width: '100%',
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  shareBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "LexendDeca_700Bold",
  },
  input: {
    borderWidth: 0,
    backgroundColor: "#eceff1",
    marginVertical: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    color: "#222",
    fontFamily: "LexendDeca_400Regular",
  },
  addParticipantsBtn: {
    backgroundColor: "#08a6c2",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  addParticipantsBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "LexendDeca_700Bold",
  },
  emptyText: {
    color: "#9aa0a6",
    marginVertical: 12,
    fontFamily: "LexendDeca_400Regular",
  },
  participantsText: {
    marginTop: 8,
    marginBottom: 8,
    color: "#7a7a7a",
    fontFamily: "LexendDeca_400Regular",
  },
  participantsName: {
    color: "#558B97",
    fontFamily: "LexendDeca_400Regular",
  },
  recommendedRow: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#cfd8dc",
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginTop: 6,
  },
  recommendedRowSelected: {
    borderColor: "#08a6c2",
    backgroundColor: "#e0f7fb",
  },
  recommendedText: {
    fontFamily: "LexendDeca_700Bold",
    color: "#424242",
  },
  manualSubtitle: {
    color: "#7a7a7a",
    fontFamily: "LexendDeca_700Bold",
    marginBottom: 6,
  },
  gridHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  gridRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  timeCol: {
    width: 52,
  },
  timeHeaderText: {
    color: "#9aa0a6",
    fontFamily: "LexendDeca_700Bold",
  },
  dayCol: {
    flex: 1,
    alignItems: "center",
  },
  dayText: {
    color: "#7a7a7a",
    fontFamily: "LexendDeca_700Bold",
  },
  manualGridScroll: {
    maxHeight: 260,
  },
  timeLabel: {
    color: "#9aa0a6",
    fontFamily: "LexendDeca_400Regular",
  },
  slotCol: {
    flex: 1,
    alignItems: "center",
  },
  slot: {
    width: 32,
    height: 32,
    borderRadius: 9,
  },
  slotSelected: {
    backgroundColor: "#08a6c2",
  },
  slotUnselected: {
    backgroundColor: "#cfd8dc",
  },
});
