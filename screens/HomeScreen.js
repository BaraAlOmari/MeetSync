import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen({
  onCreate,
  onJoin,
  onProfile,
  onHome,
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
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
        >
          <Ionicons name="person-circle" size={32} color="#c0c0c0" />
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
        <Text style={styles.emptyText}>
          No meetings yet. Create or join one to get started.
        </Text>
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
    paddingBottom: 8,
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
    paddingHorizontal: 16,
    paddingTop: 16,
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
});
