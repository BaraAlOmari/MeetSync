import { ScrollView, View, Text, TouchableOpacity, StyleSheet, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function MeetingSharingScreen({ onBack, onHome, meeting, onEdit }) {
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
          <Text style={styles.title}>Share Meeting ID</Text>
          <View style={[styles.card, { flexDirection: "row", justifyContent: "center", alignItems: "center" }]}>
            <Text style={styles.meetingID}>M1234</Text>
            <TouchableOpacity style={{ alignItems: "center", justifyContent: "center" }} accessibilityLabel="Copy meeting id">
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
              style={styles.input}
              autoCapitalize="words"
              returnKeyType="next"
            />
            <TouchableOpacity
              style={styles.addParticipantsBtn}
            >
              <Text style={styles.addParticipantsBtnText}>Add Availability</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.card, { marginVertical: 20 }]}>
          <Text style={styles.title}>Recommended Times</Text>
          <View style={[styles.card, { flexDirection: "row", justifyContent: "center", alignItems: "center" }]}>
            <Text style={styles.emptyText}>You need at least One participant to find Recommended times</Text>
          </View>
        </View>
      </ScrollView>

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
});
