import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MeetingSharingScreen({ onBack, onHome }) {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={28} color="#7a7a7a" />
          </TouchableOpacity>
        ) : null}
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
      <View style={styles.meetingConfirmContainer}>
        <TouchableOpacity style={styles.editIcon}>
          <Ionicons name="pencil-sharp" size={28} color="#08a6c2" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      <View style={styles.meetingSharingContainer}>
        <View style={styles.addManualConatiner}></View>
      </View>
      <View style={styles.divider} />

      <View style={styles.RecommendedTimesContainer}></View>

      <TouchableOpacity
        onPress={() => onHome && onHome()}
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
    color: "#558B97" ,
    fontSize: 18,
    fontFamily: "LexendDeca_700Bold",
    marginHorizontal: 10,
  },
  help: {
    marginVertical: 8,
    color: "#9aa0a6",
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
  editIcon: {
    alignSelf: "flex-end",
    padding: 25,
  },
});
