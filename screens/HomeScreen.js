import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebaseConfig";
import { collection, onSnapshot, query, where } from "firebase/firestore";

export default function HomeScreen({
  onCreate,
  onJoin,
  onProfile,
  onHome,
  onLogout,
  onViewMeeting,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [meetings, setMeetings] = useState([]);

  useEffect(() => {
    const current = auth.currentUser;
    if (!current) {
      setMeetings([]);
      return;
    }
    const uid = current.uid;

    const ownQ = query(collection(db, "meetings"), where("ownerUid", "==", uid));
    const partQ = query(
      collection(db, "meetings"),
      where("participantIds", "array-contains", uid)
    );

    let ownMeetings = [];
    let partMeetings = [];

    const recompute = () => {
      const map = new Map();
      ownMeetings.forEach((m) => map.set(m.id, m));
      partMeetings.forEach((m) => map.set(m.id, m));
      const merged = Array.from(map.values());
      merged.sort((a, b) => {
        const ta = a.createdAt?.seconds || 0;
        const tb = b.createdAt?.seconds || 0;
        return tb - ta;
      });
      setMeetings(merged);
    };

    const unsubOwn = onSnapshot(ownQ, (snap) => {
      const list = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      ownMeetings = list;
      recompute();
    });

    const unsubPart = onSnapshot(partQ, (snap) => {
      const list = [];
      snap.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      partMeetings = list;
      recompute();
    });

    return () => {
      unsubOwn();
      unsubPart();
    };
  }, []);

  const formatMeta = (meeting) => {
    const dateStr = meeting.date || "";
    let weekdayStr = "";
    if (meeting.date) {
      const d = new Date(meeting.date);
      if (!isNaN(d.getTime())) {
        weekdayStr = d.toLocaleDateString(undefined, { weekday: "short" });
      }
    }

    const whereStr =
      meeting.type === "Online"
        ? meeting.platform || "Online"
        : meeting.location || "On-site";

    const durationStr = meeting.duration || "";

    const left = [dateStr, weekdayStr].filter(Boolean).join(" ");
    const right = [whereStr, durationStr].filter(Boolean).join(" | ");
    return [left, right].filter(Boolean).join(" | ");
  };
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.brand}>
          <Text style={{ color: "#08a6c2" }}>Meet</Text>
          <Text style={{ color: "#558B97" }}>Sync</Text>
        </Text>
        <TouchableOpacity
          onPress={() => setMenuOpen((v) => !v)}
          accessibilityLabel="Profile Menu"
          style={styles.profileBtn}
        >
          <Ionicons name="person-circle" size={45} color="#c0c0c0" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onCreate}
          accessibilityLabel="Create Meeting"
          style={styles.createBtn}
        >
          <Ionicons
            name="add"
            size={20}
            color="#fff"
            style={styles.createBtnIcon}
          />
          <Text style={styles.createBtnText}>Create Meeting</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={onJoin}
          accessibilityLabel="Join Meeting"
          style={styles.joinBtn}
        >
          <Ionicons
            name="link"
            size={18}
            color="#5f6f7a"
            style={styles.joinBtnIcon}
          />
          <Text style={styles.joinBtnText}>Join Meeting</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.dividerLarge} />

      {/* My Meetings */}
      <View style={styles.meetingsSection}>
        <Text style={styles.meetingsTitle}>My Meetings :</Text>
        {meetings.length === 0 ? (
          <Text style={styles.emptyText}>
            No meetings yet. Create or join one to get started.
          </Text>
        ) : (
          <ScrollView
            style={styles.meetingsList}
            contentContainerStyle={{ paddingVertical: 12 }}
            showsVerticalScrollIndicator={false}
          >
            {meetings.map((m) => {
              const current = auth.currentUser;
              const isOwner = current && m.ownerUid === current.uid;
              const isParticipant =
                current && Array.isArray(m.participantIds)
                  ? m.participantIds.includes(current.uid)
                  : false;
              const canShare = isOwner && !m.selectedSlot;
              const showFinding = !isOwner && isParticipant && !m.selectedSlot;

              return (
                <View key={m.id} style={styles.meetingCard}>
                  <Text style={styles.meetingTitle}>{m.title || "Untitled"}</Text>
                {Array.isArray(m.tags) && m.tags.length > 0 && (
                  <View style={styles.meetingTagsRow}>
                    {m.tags.map((tag) => (
                      <View key={tag} style={styles.meetingTag}>
                        <Text style={styles.meetingTagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
                <Text style={styles.meetingMeta}>{formatMeta(m)}</Text>
                  {canShare && (
                    <TouchableOpacity
                      onPress={() => onViewMeeting && onViewMeeting(m)}
                      accessibilityLabel="View and share meeting"
                    >
                      <Text style={styles.viewShareText}>View &amp; Share</Text>
                    </TouchableOpacity>
                  )}
                  {showFinding && (
                    <Text style={styles.findingText}>Finding Best Timing</Text>
                  )}
                  {!canShare && !showFinding && m.selectedSlot && (
                    <Text style={styles.scheduledText}>
                      Scheduled: {m.selectedSlot.label || ""}
                    </Text>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={onHome} accessibilityLabel="Home">
          <Ionicons name="home" size={26} color="#08a6c2" />
        </TouchableOpacity>

        <View style={styles.fabWrapper} pointerEvents="box-none">
          <TouchableOpacity
            onPress={onCreate}
            accessibilityLabel="Create"
            style={styles.fab}
          >
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onProfile} accessibilityLabel="Profile">
          <Ionicons name="person-outline" size={26} color="#08a6c2" />
        </TouchableOpacity>
      </View>

      {menuOpen && (
        <View style={styles.menuOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setMenuOpen(false)}
          />
          <View style={styles.menuSheet}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onProfile && onProfile();
              }}
            >
              <Text style={styles.menuItemText}>Profile</Text>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setMenuOpen(false);
                onLogout && onLogout();
              }}
            >
              <Text style={styles.menuItemDanger}>Log out</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
    paddingTop: 28,
    paddingBottom: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  actions: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  createBtn: {
    backgroundColor: "#08a6c2",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  createBtnIcon: {
    marginRight: 8,
  },
  createBtnText: {
    color: "#fff",
    fontSize: 18,
    fontFamily: "LexendDeca_700Bold",
  },
  joinBtn: {
    backgroundColor: "#e9ecef",
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  joinBtnIcon: {
    marginRight: 8,
  },
  joinBtnText: {
    color: "#5f6f7a",
    fontSize: 18,
    fontFamily: "LexendDeca_700Bold",
  },
  dividerLarge: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
    marginTop: 24,
  },
  meetingsSection: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 80, // space above bottom nav
  },
  meetingsTitle: {
    color: "#7a7a7a",
    fontSize: 18,
    fontFamily: "LexendDeca_700Bold",
  },
  emptyText: {
    color: "#9aa0a6",
    marginTop: 12,
    fontFamily: "LexendDeca_400Regular",
  },
  meetingsList: {
    flex: 1,
    marginTop: 8
  },
  meetingCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#558b97ff",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: "#558b9711",
  },
  meetingTitle: {
    fontFamily: "LexendDeca_700Bold",
    fontSize: 16,
    color: "#424242",
    marginBottom: 6,
  },
  meetingTagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 6,
  },
  meetingTag: {
    backgroundColor: "#08a6c2",
    borderRadius: 12,
    paddingVertical: 3,
    paddingHorizontal: 8,
    marginRight: 6,
  },
  meetingTagText: {
    color: "#fff",
    fontFamily: "LexendDeca_700Bold",
    fontSize: 12,
  },
  meetingMeta: {
    color: "#7a7a7a",
    fontFamily: "LexendDeca_400Regular",
    marginBottom: 8,
  },
  viewShareText: {
    color: "#08a6c2",
    fontFamily: "LexendDeca_700Bold",
  },
  findingText: {
    color: "#ff9800",
    fontFamily: "LexendDeca_700Bold",
  },
  scheduledText: {
    color: "#388e3c",
    fontFamily: "LexendDeca_700Bold",
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
    overflow: "visible",
  },
  fabWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: "center",
    zIndex: 50,
  },
  fab: {
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
    elevation: 8,
    zIndex: 51,
  },
  menuOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  menuSheet: {
    position: "absolute",
    top: 60,
    right: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 8,
    width: 180,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontFamily: "LexendDeca_700Bold",
    color: "#333",
  },
  menuItemDanger: {
    fontFamily: "LexendDeca_700Bold",
    color: "#d32f2f",
  },
  menuDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginHorizontal: 8,
  },
  profileBtn: {
    marginBottom: -12
  }
});
