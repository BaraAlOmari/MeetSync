import { Platform } from "react-native";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: "AIzaSyCIcOEpH2xs5z0I03HnGHh1GPBbNtQbsGc",
  authDomain: "meetsync-43730.firebaseapp.com",
  projectId: "meetsync-43730",
  storageBucket: "meetsync-43730.firebasestorage.app",
  messagingSenderId: "988859247153",
  appId: "1:988859247153:web:68fdbecd461d1953154310"
};

const app = initializeApp(firebaseConfig);

// Keep the session across app restarts. getAuth() alone only keeps it in memory
// on React Native. initializeAuth throws if called twice (e.g. after a reload).
function createAuth() {
  if (Platform.OS === "web") return getAuth(app);
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
