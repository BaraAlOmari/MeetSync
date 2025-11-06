import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SignUpScreen({ onBack }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (!email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    console.log('Sign up', { firstName, lastName, email });
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingTop: 36, paddingHorizontal: 16, paddingBottom: 16 }} style={{ flex: 1, backgroundColor: '#ffffff' }}>
        <View style={{ flex: 1, padding: 24, justifyContent: 'space-between' }}>
        <TouchableOpacity
          onPress={onBack}
          accessibilityLabel="Back to Login"
          style={{ position: 'absolute', top: 8, left: 8, padding: 8, zIndex: 10 }}
        >
          <Ionicons name="chevron-back" size={28} color="#7a7a7a" />
        </TouchableOpacity>
        <View>
          <Text style={{ textAlign: 'center', color: '#7a7a7a', fontSize: 18, marginTop: 20, fontFamily: 'LexendDeca_400Regular' }}>Welcome to</Text>
          <Text style={{ textAlign: 'center', fontSize: 42, fontFamily: 'LexendDeca_700Bold' }}>
            <Text style={{ color: '#08a6c2' }}>Meet</Text>
            <Text style={{ color: '#558B97' }}>Sync</Text>
          </Text>
          <Text style={{ textAlign: 'center', color: '#558B97', marginTop: 6, fontSize: 16, fontFamily: 'LexendDeca_400Regular' }}>Smart meeting scheduling made simple</Text>

          <View style={[styles.card, { marginTop: 40 }]}>
            <Text style={[styles.label, { color: '#558B97', fontSize: 18 }]}>Create Account</Text>

            <TextInput
              value={firstName}
              onChangeText={(t) => { setFirstName(t); if (error) setError(''); }}
              placeholder="First Name"
              placeholderTextColor="#9aa0a6"
              autoCapitalize="words"
              style={styles.input}
              returnKeyType="next"
            />

            <TextInput
              value={lastName}
              onChangeText={(t) => { setLastName(t); if (error) setError(''); }}
              placeholder="Last Name"
              placeholderTextColor="#9aa0a6"
              autoCapitalize="words"
              style={styles.input}
              returnKeyType="next"
            />

            <TextInput
              value={email}
              onChangeText={(t) => { setEmail(t); if (error) setError(''); }}
              placeholder="Email"
              placeholderTextColor="#9aa0a6"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              returnKeyType="next"
            />

            <TextInput
              value={password}
              onChangeText={(t) => { setPassword(t); if (error) setError(''); }}
              placeholder="Password"
              placeholderTextColor="#9aa0a6"
              secureTextEntry
              style={styles.input}
              returnKeyType="next"
            />

            <TextInput
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); if (error) setError(''); }}
              placeholder="Confirm Password"
              placeholderTextColor="#9aa0a6"
              secureTextEntry
              style={styles.input}
              returnKeyType="done"
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity style={{ alignSelf: 'center', marginTop: 8 }} accessibilityLabel="Go to login" onPress={onBack}>
              <Text style={[styles.label, { color: '#08a6c2', fontSize: 16 }]}>Already have an account? Log In</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.fab} accessibilityLabel="Create Account" onPress={handleSubmit}>
          <Ionicons name="arrow-forward" size={35} color="#fff" />
        </TouchableOpacity>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = {
  card: { backgroundColor: 'white', borderRadius: 12, padding: 12 },
  label: { marginBottom: 6, fontSize: 16, fontFamily: 'LexendDeca_700Bold' },
  input: { borderWidth: 0, backgroundColor: '#eceff1', marginVertical: 12, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 12, color: '#222', fontFamily: 'LexendDeca_400Regular' },
  inputError: { borderWidth: 1, borderColor: '#d32f2f', backgroundColor: '#fdecea' },
  primaryBtn: { backgroundColor: '#1976d2', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  primaryBtnText: { color: 'white', fontFamily: 'LexendDeca_700Bold' },
  fab: { alignSelf: 'flex-end', backgroundColor: '#08a6c2', width: 72, height: 72, borderRadius: 49, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, marginBottom: 8, marginRight: -20 },
  errorText: { color: '#d32f2f', marginTop: 6, fontFamily: 'LexendDeca_400Regular' },
};
