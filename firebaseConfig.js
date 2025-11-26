import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCIcOEpH2xs5z0I03HnGHh1GPBbNtQbsGc",
  authDomain: "meetsync-43730.firebaseapp.com",
  projectId: "meetsync-43730",
  storageBucket: "meetsync-43730.firebasestorage.app",
  messagingSenderId: "988859247153",
  appId: "1:988859247153:web:68fdbecd461d1953154310"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

