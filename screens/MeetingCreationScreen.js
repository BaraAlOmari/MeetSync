import { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Dropdown } from "react-native-element-dropdown";

const DURATIONS = ["1 Hour", "2 Hours", "3 Hours"];
const FLEXES = ["0 mins", "15 mins", "30 mins", "1 Hour"];
const PLATFORMS = [
  "Zoom",
  "Google Meet",
  "Microsoft Teams",
  "Discord",
  "Other",
];
const TAGS = ["Work", "College", "School", "Friends", "Family", "Others"];

export default function MeetingCreationScreen({ onNext, onBack }) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [durationIdx, setDurationIdx] = useState(0);
  const [flexIdx, setFlexIdx] = useState(0);
  const [type, setType] = useState("Online");
  const [platformIdx, setPlatformIdx] = useState(0);
  const [location, setLocation] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [selectedTags, setSelectedTags] = useState(new Set());

  const duration = DURATIONS[durationIdx];
  const timeFlex = FLEXES[flexIdx];
  const platform = PLATFORMS[platformIdx];

  const toggleTag = (t) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  };

  const nextPayload = useMemo(
    () => ({
      title,
      date: isNaN(date?.getTime?.()) ? "" : date.toISOString().slice(0, 10),
      duration,
      timeFlex,
      type,
      platform: type === "Online" ? platform : "",
      location: type === "On-site" ? location : "",
      recurring,
      tags: Array.from(selectedTags),
    }),
    [title, date, duration, timeFlex, type, platform, recurring, selectedTags]
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        {onBack ? (
          <TouchableOpacity onPress={onBack} accessibilityLabel="Back">
            <Ionicons name="chevron-back" size={28} color="#7a7a7a" />
          </TouchableOpacity>
        ) : null}

        <Text style={styles.pageTitle}>Create New Meeting</Text>
      </View>



      <View style={styles.divider} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: 120 }}
        >

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Title:</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Project meeting"
              placeholderTextColor="#9aa0a6"
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Date:</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDate(true)}
            >
              <Text
                style={{ color: "#5f6f7a", fontFamily: "LexendDeca_700Bold" }}
              >
                {isNaN(date?.getTime?.())
                  ? "Pick a date"
                  : date.toISOString().slice(0, 10)}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.rowTwoCols}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.label}>Duration:</Text>
              <Dropdown
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                data={DURATIONS.map((d, i) => ({ label: d, value: i }))}
                labelField="label"
                valueField="value"
                value={durationIdx}
                onChange={(item) => setDurationIdx(item.value)}
                placeholder={DURATIONS[durationIdx]}
                selectedTextStyle={styles.dropdownText}
                placeholderStyle={styles.dropdownText}
                itemTextStyle={styles.dropdownItemText}
                activeColor="#e9ecef"
                renderRightIcon={() => (
                  <Ionicons name="chevron-down" size={18} color="#5f6f7a" />
                )}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.label}>Time Flex:</Text>
              <Dropdown
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                data={FLEXES.map((f, i) => ({ label: f, value: i }))}
                labelField="label"
                valueField="value"
                value={flexIdx}
                onChange={(item) => setFlexIdx(item.value)}
                placeholder={FLEXES[flexIdx]}
                selectedTextStyle={styles.dropdownText}
                placeholderStyle={styles.dropdownText}
                itemTextStyle={styles.dropdownItemText}
                activeColor="#e9ecef"
                renderRightIcon={() => (
                  <Ionicons name="chevron-down" size={18} color="#5f6f7a" />
                )}
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Type:</Text>
            <View style={styles.segmentRow}>
              <TouchableOpacity
                onPress={() => setType("Online")}
                style={[
                  styles.segment,
                  type === "Online"
                    ? styles.segmentActive
                    : styles.segmentInactive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    type === "Online"
                      ? styles.segmentTextActive
                      : styles.segmentTextInactive,
                  ]}
                >
                  Online
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setType("On-site")}
                style={[
                  styles.segment,
                  type === "On-site"
                    ? styles.segmentActive
                    : styles.segmentInactive,
                ]}
              >
                <Text
                  style={[
                    styles.segmentText,
                    type === "On-site"
                      ? styles.segmentTextActive
                      : styles.segmentTextInactive,
                  ]}
                >
                  On-site
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {type === "Online" ? (
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Platform:</Text>
              <Dropdown
                style={styles.dropdown}
                containerStyle={styles.dropdownContainer}
                data={PLATFORMS.map((p, i) => ({ label: p, value: i }))}
                labelField="label"
                valueField="value"
                value={platformIdx}
                onChange={(item) => setPlatformIdx(item.value)}
                placeholder={PLATFORMS[platformIdx]}
                selectedTextStyle={styles.dropdownText}
                placeholderStyle={styles.dropdownText}
                itemTextStyle={styles.dropdownItemText}
                activeColor="#e9ecef"
                renderRightIcon={() => (
                  <Ionicons name="chevron-down" size={18} color="#5f6f7a" />
                )}
              />
            </View>
          ) : (
            <View style={styles.fieldBlock}>
              <Text style={styles.label}>Location:</Text>
              <TextInput
                value={location}
                onChangeText={setLocation}
                placeholder="Enter location"
                placeholderTextColor="#9aa0a6"
                style={styles.input}
                returnKeyType="done"
              />
            </View>
          )}

          <View style={styles.rowTwoCols}>
            <View style={styles.switchRow}>
              <Text style={styles.label}>Recurring weekly:</Text>
              <Switch
                style={styles.switch}
                value={recurring}
                onValueChange={setRecurring}
                thumbColor={recurring ? "#08a6c2" : undefined}
                trackColor={{ true: "#bfe9f0" }}
              />
            </View>
          </View>

          <View style={styles.fieldBlock}>
            <Text style={styles.label}>Tag:</Text>
            <View style={styles.tagsRow}>
              {TAGS.map((tag) => {
                const on = selectedTags.has(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => toggleTag(tag)}
                    style={[styles.tag, on ? styles.tagOn : styles.tagOff]}
                  >
                    <Text
                      style={[
                        styles.tagText,
                        on ? styles.tagTextOn : styles.tagTextOff,
                      ]}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <TouchableOpacity
        onPress={() => onNext && onNext(nextPayload)}
        style={styles.fab}
        accessibilityLabel="Next"
      >
        <Ionicons name="arrow-forward" size={32} color="#fff" />
      </TouchableOpacity>

      {showDate && (
        <DateTimePicker
          value={date || new Date()}
          mode="date"
          display={Platform.OS === "ios" ? "inline" : "default"}
          onChange={(e, d) => {
            setShowDate(false);
            if (d) setDate(d);
          }}
        />
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
  fieldBlock: {
    marginTop: 12,
    paddingHorizontal: 16,
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
  rowTwoCols: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginTop: 12,
  },
  select: {
    backgroundColor: "#eceff1",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectText: {
    color: "#5f6f7a",
    fontFamily: "LexendDeca_700Bold",
  },
  dropdown: {
    backgroundColor: "#eceff1",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dropdownContainer: {
    borderRadius: 12,
    paddingVertical: 6,
  },
  dropdownText: {
    color: "#5f6f7a",
    fontFamily: "LexendDeca_700Bold",
  },
  dropdownItemText: {
    color: "#5f6f7a",
    fontFamily: "LexendDeca_400Regular",
  },
  segmentRow: {
    flexDirection: "row",
  },
  segment: {
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  segmentActive: {
    backgroundColor: "#08a6c2",
  },
  segmentInactive: {
    backgroundColor: "#e9ecef",
  },
  segmentText: {
    fontFamily: "LexendDeca_700Bold",
  },
  segmentTextActive: {
    color: "#fff",
  },
  segmentTextInactive: {
    color: "#5f6f7a",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  tag: {
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
    marginBottom: 8,
  },
  tagOn: {
    backgroundColor: "#08a6c2",
  },
  tagOff: {
    backgroundColor: "#e9ecef",
  },
  tagText: {
    fontFamily: "LexendDeca_700Bold",
  },
  tagTextOn: {
    color: "#fff",
  },
  tagTextOff: {
    color: "#5f6f7a",
  },
  switchRow: {
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  switch: {
    marginLeft: 10,
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
