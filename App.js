import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { useFonts } from '@expo-google-fonts/lexend-deca';
import {
  LexendDeca_400Regular,
  LexendDeca_700Bold,
} from '@expo-google-fonts/lexend-deca';
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import AvailabilityScreen from './screens/AvailabilityScreen';
import HomeScreen from './screens/HomeScreen';

export default function App() {
  const [fontsLoaded] = useFonts({
    LexendDeca_400Regular,
    LexendDeca_700Bold,
  });
  const [route, setRoute] = useState('login');

  if (!fontsLoaded) {
    return null;
  }
  return (
    <View style={styles.container}>
      {route === 'login' && (
        <LoginScreen
          onSignUpPress={() => setRoute('signup')}
          onLoginSuccess={() => setRoute('home')}
        />
      )}
      {route === 'signup' && (
        <SignUpScreen onBack={() => setRoute('login')} onNext={() => setRoute('availability')} />
      )}
      {route === 'availability' && (
        <AvailabilityScreen onNext={() => setRoute('home')} />
      )}
      {route === 'home' && (
        <HomeScreen
          onCreate={() => console.log('Create Meeting')}
          onJoin={() => console.log('Join Meeting')}
          onProfile={() => console.log('Profile')}
          onHome={() => setRoute('home')}
        />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
