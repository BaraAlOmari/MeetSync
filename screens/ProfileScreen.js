import { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth, db } from "../firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ProfileScreen({
  user,
  availability,
  onSave,
  onHome,
  onLogout,
  onCreate,
}) {
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");

  // Convert incoming arrays to Sets for efficient toggling
  const initialAvailSets = useMemo(() => {
    const m = {};
    DAYS.forEach((d) => {
      m[d] = new Set((availability && availability[d]) || []);
    });
    return m;
  }, [availability]);
  const [availSets, setAvailSets] = useState(initialAvailSets);

  useEffect(() => {
    setAvailSets(initialAvailSets);
  }, [initialAvailSets]);

  const toggleSlot = (day, hour) => {
    setAvailSets((prev) => {
      const next = { ...prev, [day]: new Set(prev[day]) };
      if (next[day].has(hour)) next[day].delete(hour);
      else next[day].add(hour);
      return next;
    });
  };

  const hours = useMemo(() => {
    const list = [];
    for (let h = 8; h <= 23; h++) list.push(h);
    return list;
  }, []);

  const handleSave = async () => {
    const normalized = Object.fromEntries(
      DAYS.map((d) => [d, Array.from(availSets[d])])
    );

    const current = auth.currentUser;
    if (current) {
      try {
        await updateDoc(doc(db, "users", current.uid), {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          availability: normalized,
        });
      } catch (e) {
        // best-effort; UI state still updates
      }
    }

    onSave &&
      onSave(
        { firstName, lastName, email: user?.email || "", uid: current?.uid },
        normalized
      );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.brand}>
          <Text style={{ color: "#08a6c2" }}>Meet</Text>
          <Text style={{ color: "#558B97" }}>Sync</Text>
        </Text>
      </View>
      <View style={styles.divider} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 180 }}
      >
        {/* Form */}
        <View style={styles.formContainer}>
          <Text style={styles.pageTitle}>My Profile</Text>
          <Text style={styles.sectionTitle}>Edit Name</Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First Name"
            placeholderTextColor="#9aa0a6"
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="next"
          />
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last Name"
            placeholderTextColor="#9aa0a6"
            style={styles.input}
            autoCapitalize="words"
            returnKeyType="done"
          />
        </View>

        {/* Availability Editor */}
        <Text style={[styles.sectionTitle, { marginHorizontal: 16 }]}>
          Update Availability
        </Text>
        <View style={styles.card}>
          <View style={styles.gridHeaderRow}>
            <View style={styles.timeCol}>
              <Text style={styles.timeHeaderText}>Time</Text>
            </View>
            {DAYS.map((d) => (
              <View key={d} style={styles.dayCol}>
                <Text style={styles.dayText}>{d}</Text>
              </View>
            ))}
          </View>
          <ScrollView
            style={styles.gridScroll}
            showsVerticalScrollIndicator
            nestedScrollEnabled
          >
            {hours.map((h) => (
              <View key={h} style={styles.gridRow}>
                <View style={styles.timeCol}>
                  <Text style={styles.timeLabel}>
                    {String(h).padStart(2, "0")}:00
                  </Text>
                </View>
                {DAYS.map((d) => {
                  const selected = availSets[d].has(h);
                  return (
                    <View key={`${d}-${h}`} style={styles.slotCol}>
                      <TouchableOpacity
                        onPress={() => toggleSlot(d, h)}
                        style={[
                          styles.slot,
                          selected
                            ? styles.slotSelected
                            : styles.slotUnselected,
                        ]}
                        accessibilityLabel={`${d} ${String(h).padStart(
                          2,
                          "0"
                        )}:00`}
                      />
                    </View>
                  );
                })}
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Save button */}
        <View style={{ paddingHorizontal: 16 }}>
          <TouchableOpacity
            onPress={handleSave}
            style={styles.saveBtn}
            accessibilityLabel="Save Profile"
          >
            <Text style={styles.saveBtnText}>Save Changes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onLogout}
            accessibilityLabel="Log Out"
            style={{ marginTop: 12, alignItems: "center" }}
          >
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Bottom nav */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={onHome} accessibilityLabel="Home">
          <Ionicons name="home-outline" size={26} color="#08a6c2" />
        </TouchableOpacity>
        <TouchableOpacity accessibilityLabel="Profile">
          <Ionicons name="person" size={26} color="#08a6c2" />
        </TouchableOpacity>
      </View>
      <View style={styles.fabWrapper} pointerEvents="box-none">
        <TouchableOpacity
          onPress={onCreate}
          accessibilityLabel="Create"
          style={styles.fab}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    color: "#a8a8a8ff",
    fontSize: 18,
    fontFamily: "LexendDeca_700Bold",
  },
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
  brand: { fontSize: 32, fontFamily: "LexendDeca_700Bold" },
  logoutText: {
    fontSize: 16,
    color: "#d32f2f",
    fontFamily: "LexendDeca_700Bold",
  },
  divider: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 16,
  },
  formContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    color: "#7a7a7a",
    fontFamily: "LexendDeca_700Bold",
    marginBottom: 2,
    marginTop: 14,
  },
  input: {
    borderWidth: 0,
    backgroundColor: "#eceff1",
    marginVertical: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    color: "#222",
    fontFamily: "LexendDeca_400Regular",
  },
  card: {
    margin: 16,
    backgroundColor: "#f0f2f4",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  gridHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  gridRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 6,
  },
  timeCol: {
    width: 56,
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
  gridScroll: {
    maxHeight: 360,
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
    width: 36,
    height: 36,
    borderRadius: 10,
  },
  slotSelected: {
    backgroundColor: "#08a6c2",
  },
  slotUnselected: {
    backgroundColor: "#cfd8dc",
  },
  saveBtn: {
    backgroundColor: "#08a6c2",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
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
  },
  fabWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 20,
    alignItems: "center",
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
});
