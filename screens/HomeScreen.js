import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen({ onCreate, onJoin, onProfile, onHome }) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.brand}>
          <Text style={{ color: '#08a6c2' }}>Meet</Text>
          <Text style={{ color: '#558B97' }}>Sync</Text>
        </Text>
        <TouchableOpacity onPress={onProfile} accessibilityLabel="Profile">
          <Ionicons name="person-circle" size={32} color="#c0c0c0" />
        </TouchableOpacity>
      </View>
      <View style={styles.divider} />

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          onPress={onCreate}
          accessibilityLabel="Create Meeting"
          style={styles.createBtn}
        >
          <Ionicons name="add" size={20} color="#fff" style={styles.createBtnIcon} />
          <Text style={styles.createBtnText}>Create Meeting</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onJoin} accessibilityLabel="Join Meeting" style={styles.joinBtn}>
          <Ionicons name="link" size={18} color="#5f6f7a" style={styles.joinBtnIcon} />
          <Text style={styles.joinBtnText}>Join Meeting</Text>
        </TouchableOpacity>
      </View>

      {/* Divider above meetings list */}
      <View style={styles.dividerLarge} />

      {/* My Meetings header (empty state – no cards yet) */}
      <View style={styles.meetingsSection}>
        <Text style={styles.meetingsTitle}>My Meetings :</Text>
        <Text style={styles.emptyText}>No meetings yet. Create or join one to get started.</Text>
      </View>

      {/* Bottom Nav with floating action button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity onPress={onHome} accessibilityLabel="Home">
          <Ionicons name="home-outline" size={26} color="#08a6c2" />
        </TouchableOpacity>

        <View style={styles.fabWrapper} pointerEvents="box-none">
          <TouchableOpacity onPress={onCreate} accessibilityLabel="Create" style={styles.fab}>
            <Ionicons name="add" size={30} color="#fff" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={onProfile} accessibilityLabel="Profile">
          <Ionicons name="person-outline" size={26} color="#08a6c2" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = {
  container: { flex: 1, backgroundColor: '#ffffff' },
  headerRow: { paddingHorizontal: 16, paddingTop: 28, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { fontSize: 32, fontFamily: 'LexendDeca_700Bold' },
  divider: { height: 1, backgroundColor: '#e0e0e0', marginHorizontal: 16 },
  actions: { paddingHorizontal: 16, paddingTop: 20 },
  createBtn: { backgroundColor: '#08a6c2', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
  createBtnIcon: { marginRight: 8 },
  createBtnText: { color: '#fff', fontSize: 18, fontFamily: 'LexendDeca_700Bold' },
  joinBtn: { backgroundColor: '#e9ecef', borderRadius: 10, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  joinBtnIcon: { marginRight: 8 },
  joinBtnText: { color: '#5f6f7a', fontSize: 18, fontFamily: 'LexendDeca_700Bold' },
  dividerLarge: { height: 1, backgroundColor: '#e0e0e0', marginHorizontal: 16, marginTop: 24 },
  meetingsSection: { paddingHorizontal: 16, paddingTop: 16 },
  meetingsTitle: { color: '#7a7a7a', fontSize: 18, fontFamily: 'LexendDeca_700Bold' },
  emptyText: { color: '#9aa0a6', marginTop: 12, fontFamily: 'LexendDeca_400Regular' },
  bottomBar: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: '#f6f7f8', borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingVertical: 20, paddingHorizontal: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fabWrapper: { position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center' },
  fab: { width: 64, height: 64, borderRadius: 40, backgroundColor: '#08a6c2', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } },
};
