import { useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const START_HOUR = 8;
const END_HOUR = 23;

export default function AvailabilityScreen({ onNext }) {
  const times = useMemo(() => {
    const t = [];
    for (let h = START_HOUR; h <= END_HOUR; h++) {
      const label = `${h.toString().padStart(2, "0")}:00`;
      t.push({ hour: h, label });
    }
    return t;
  }, []);

  const initial = useMemo(() => {
    const m = {};
    DAYS.forEach((d) => {
      m[d] = new Set();
    });
    return m;
  }, []);

  const [availability, setAvailability] = useState(initial);

  const toggleSlot = (day, hour) => {
    setAvailability((prev) => {
      const next = { ...prev, [day]: new Set(prev[day]) };
      if (next[day].has(hour)) next[day].delete(hour);
      else next[day].add(hour);
      return next;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.brand}>
          <Text style={{ color: "#08a6c2" }}>Meet</Text>
          <Text style={{ color: "#558B97" }}>Sync</Text>
        </Text>
      </View>
      <View style={styles.divider} />

      <Text style={styles.sectionTitle}>Select your Availability:</Text>

      <View style={styles.card}>
        {/* Header Row */}
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

        <ScrollView style={styles.gridScroll} showsVerticalScrollIndicator>
          {times.map(({ hour, label }) => (
            <View key={hour} style={styles.gridRow}>
              <View style={styles.timeCol}>
                <Text style={styles.timeLabel}>{label}</Text>
              </View>
              {DAYS.map((d) => {
                const selected = availability[d].has(hour);
                return (
                  <View key={`${d}-${hour}`} style={styles.slotCol}>
                    <TouchableOpacity
                      onPress={() => toggleSlot(d, hour)}
                      style={[
                        styles.slot,
                        selected ? styles.slotSelected : styles.slotUnselected,
                      ]}
                      accessibilityLabel={`${d} ${label}`}
                    />
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>

      <TouchableOpacity
        onPress={() => {
          console.log(
            "Availability selected",
            Object.fromEntries(
              DAYS.map((d) => [d, Array.from(availability[d])])
            )
          );
          if (onNext) onNext(availability);
        }}
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
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
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
  sectionTitle: {
    marginTop: 16,
    marginHorizontal: 16,
    color: "#7a7a7a",
    fontSize: 18,
    fontFamily: "LexendDeca_700Bold",
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
    maxHeight: 560,
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
});
