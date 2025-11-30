import { useEffect, useState } from "react";
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { auth, db } from "../firebaseConfig";
import { addDoc, collection, deleteDoc, doc, getDoc, updateDoc } from "firebase/firestore";

const DAY_KEYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const START_HOUR = 8;
const END_HOUR = 23;

export default function MeetingSharingScreen({ onBack, onHome, meeting, onEdit }) {
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
  const handleCancelMeeting = async () => {
    try {
      if (meeting?.id) {
        await deleteDoc(doc(db, "meetings", meeting.id));
      }
    } catch (e) {
    }
    if (onHome) onHome();
  };

  async function computeRecommendedFor(currentMeeting) {
    if (!currentMeeting || !currentMeeting.date) {
      setRecommendedSlots([]);
      setParticipantsList([]);
      return;
    }

    const dayIndex = new Date(currentMeeting.date).getDay();
    const dayKey = DAY_KEYS[dayIndex] || "";
    if (!dayKey) {
      setRecommendedSlots([]);
      setParticipantsList([]);
      return;
    }

    const participants = Array.isArray(currentMeeting.participants)
      ? currentMeeting.participants
      : [];
    setParticipantsList(participants);

    if (participants.length < 2) {
      setRecommendedSlots([]);
      return;
    }

    setCalcLoading(true);
    try {
      const durationStr = currentMeeting.duration || "1 Hour";
      const durationHours = parseInt(durationStr, 10) || 1;

      // Simple time-flexibility handling: treat timeFlex as how much we can
      // relax the required overlap duration across all participants.
      const flexStr = currentMeeting.timeFlex || "0";
      const numMatch = flexStr.match(/(\d+)/);
      const baseNum = numMatch ? parseInt(numMatch[1], 10) : 0;
      const isHour = /hour/i.test(flexStr);
      const flexMinutes = isHour ? baseNum * 60 : baseNum;
      const flexHours = flexMinutes / 60;

      // Fetch availability for each participant
      const avails = [];
      for (const p of participants) {
        if (p.availability) {
          avails.push(p.availability);
          continue;
        }
        if (p.uid) {
          const snap = await getDoc(doc(db, "users", p.uid));
          if (snap.exists()) {
            const data = snap.data();
            avails.push(data.availability || {});
          } else {
            avails.push({});
          }
        } else {
          avails.push({});
        }
      }

      const slots = [];

      const toLabel = (timeFloat) => {
        const hour = Math.floor(timeFloat);
        const minutes = Math.round((timeFloat - hour) * 60);
        const hh = String(hour).padStart(2, "0");
        const mm = String(minutes).padStart(2, "0");
        return `${hh}:${mm}`;
      };

      for (let h = START_HOUR; h <= END_HOUR - durationHours + 1; h += 1) {
        // Compute the actual meeting window in hours after applying flex.
        const realStart = h + flexHours;
        const realEnd = realStart + durationHours;

        // Convert to whole hours that the meeting (including flex shift)
        // will occupy, so we can check availability and later block them.
        const blockStart = Math.floor(realStart);
        const blockEnd = Math.ceil(realEnd);

        if (blockStart < START_HOUR || blockEnd > END_HOUR + 1) {
          continue;
        }

        let ok = true;
        for (let i = 0; i < avails.length && ok; i += 1) {
          const availDay = Array.isArray(avails[i][dayKey])
            ? avails[i][dayKey]
            : [];
          const set = new Set(availDay);
          for (let hour = blockStart; hour < blockEnd; hour += 1) {
            if (!set.has(hour)) {
              ok = false;
              break;
            }
          }
        }

        if (!ok) continue;

        // These are the times shown to the user and also the
        // window we treat as unavailable after scheduling.
        const displayStart = realStart;
        const displayEnd = realEnd;

        // Skip any slots that would cross past midnight (24:00),
        // so we never show times like "24:15".
        if (displayStart >= 24 || displayEnd > 24) {
          continue;
        }

        const startLabel = toLabel(displayStart);
        const endLabel = toLabel(displayEnd);
        slots.push({
          startHour: h,
          label: `${startLabel} - ${endLabel}`,
        });
      }

      setRecommendedSlots(slots);
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

    // Toggle off if the same slot is tapped again
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

    try {
      // Create a guest user document with only name and availability
      const guestRef = await addDoc(collection(db, "users"), {
        firstName: name,
        lastName: "",
        availability: normalized,
        isGuest: true,
      });

      const newParticipant = {
        uid: guestRef.id,
        name,
        isGuest: true,
        availability: normalized,
      };

      // Safely append this participant using the latest meeting snapshot
      const meetingRef = doc(db, "meetings", meeting.id);
      const snap = await getDoc(meetingRef);
      const data = snap.exists() ? snap.data() || {} : {};
      const existingParticipants = Array.isArray(data.participants)
        ? data.participants
        : [];
      const nextParticipants = [...existingParticipants, newParticipant];

      await updateDoc(meetingRef, {
        participants: nextParticipants,
      });

      const updatedMeeting = {
        ...meeting,
        participants: nextParticipants,
      };

      // Reset manual form
      setManualName("");
      setManualAvail(() => {
        const initial = {};
        DAY_KEYS.forEach((d) => {
          initial[d] = new Set();
        });
        return initial;
      });
      setShowManualGrid(false);

      // Recompute recommended times including this new participant
      await computeRecommendedFor(updatedMeeting);
    } catch (e) {
      // Best-effort; do not break the screen if something goes wrong
    }
  };

  const handleConfirmSelection = async () => {
    if (!meeting || !meeting.id || !meeting.date) {
      if (onHome) onHome();
      return;
    }

    const current = auth.currentUser;
    if (!current || meeting.ownerUid !== current.uid) {
      if (onHome) onHome();
      return;
    }

    // Only schedule when a slot is actively selected.
    if (!pendingSlot) {
      if (onHome) onHome();
      return;
    }

    const dayIndex = new Date(meeting.date).getDay();
    const dayKey = DAY_KEYS[dayIndex] || "";
    if (!dayKey) {
      if (onHome) onHome();
      return;
    }

    const durationStr = meeting.duration || "1 Hour";
    const durationHours = parseInt(durationStr, 10) || 1;

    // Derive flex in hours from meeting.timeFlex (15 mins, 30 mins, 1 Hour)
    const flexStr = meeting.timeFlex || "0";
    const numMatch = flexStr.match(/(\d+)/);
    const baseNum = numMatch ? parseInt(numMatch[1], 10) : 0;
    const isHour = /hour/i.test(flexStr);
    const flexMinutes = isHour ? baseNum * 60 : baseNum;
    const flexHours = flexMinutes / 60;

    // Compute the actual meeting window in hours, including flexibility offset.
    const realStart = pendingSlot.startHour + flexHours;
    const realEnd = realStart + durationHours;

    // Round to whole hours for availability blocking.
    const blockStart = Math.floor(realStart);
    const blockEnd = Math.ceil(realEnd);

    const hoursToBlock = [];
    for (let h = blockStart; h < blockEnd; h += 1) {
      hoursToBlock.push(h);
    }

    try {
      // Update meeting selectedSlot (single source of truth in Firestore)
      await updateDoc(doc(db, "meetings", meeting.id), {
        selectedSlot: {
          label: pendingSlot.label,
          startHour: pendingSlot.startHour,
          dayKey,
        },
      });
      setSelectedLabel(pendingSlot.label);

      // Update availability for all non-guest participants, including owner.
      const participants = Array.isArray(meeting.participants)
        ? meeting.participants
        : [];

      for (const p of participants) {
        if (!p.uid || p.isGuest) continue;

        const userRef = doc(db, "users", p.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) continue;
        const data = snap.data() || {};
        const avail = data.availability || {};
        const dayArr = Array.isArray(avail[dayKey]) ? avail[dayKey] : [];
        const filteredDay = dayArr.filter(
          (h) => !hoursToBlock.includes(h)
        );
        await updateDoc(userRef, {
          availability: {
            ...avail,
            [dayKey]: filteredDay,
          },
        });
      }
    } finally {
      if (onHome) onHome();
    }
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
                {(() => {
                  if (!meeting.date) return "-";
                  const d = new Date(meeting.date);
                  if (Number.isNaN(d.getTime())) return meeting.date;
                  const weekday = d.toLocaleDateString(undefined, {
                    weekday: "short",
                  });
                  return [meeting.date, weekday].filter(Boolean).join(" ");
                })()}
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


        <View style={[styles.card, { marginTop: 20 }]}>
          <Text style={styles.title}>Share Meeting Code</Text>
          <View style={[styles.card, { flexDirection: "row", justifyContent: "center", alignItems: "center" }]}>
            <Text style={styles.meetingID}>{meeting?.code || "-"}</Text>
            <TouchableOpacity
              style={{ alignItems: "center", justifyContent: "center" }}
              accessibilityLabel="Copy meeting code"
              onPress={async () => {
                if (!meeting?.code) return;
                try {
                  if (Platform.OS === "web" && navigator?.clipboard?.writeText) {
                    await navigator.clipboard.writeText(meeting.code);
                  } else {
                    await Clipboard.setStringAsync(meeting.code);
                  }
                } catch (e) {
                }
              }}
            >
              <Ionicons name="copy" size={20} color="#c3c3c3ff" />
            </TouchableOpacity>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={styles.title}>OR</Text>
          </View>
          <View style={styles.card}>
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
  brand: {
    textAlign: "left",
    fontSize: 32,
    fontFamily: "LexendDeca_700Bold",
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
  meetingMeta: {
    color: "#7a7a7a",
    fontFamily: "LexendDeca_400Regular",
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
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#f6f7f8",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  meetingID: {
    fontFamily: "LexendDeca_700Bold",
    fontSize: 24,
    color: "#08a6c2",
    margin: 10,
    marginTop: 5
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
        color:"#558B97",
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
