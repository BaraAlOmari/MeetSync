import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import {
  useFonts,
  LexendDeca_400Regular,
  LexendDeca_700Bold,
} from "@expo-google-fonts/lexend-deca";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { auth, db } from "./firebaseConfig";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import AvailabilityScreen from "./screens/AvailabilityScreen";
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MeetingCreationScreen from "./screens/MeetingCreationScreen";
import MeetingSharingScreen from "./screens/MeetingSharingScreen";
import MeetingJoinScreen from "./screens/MeetingJoinScreen";

SplashScreen.preventAutoHideAsync().catch(() => {});

const Stack = createNativeStackNavigator();

const EMPTY_AVAILABILITY = {
  Sun: [],
  Mon: [],
  Tue: [],
  Wed: [],
  Thu: [],
  Fri: [],
  Sat: [],
};

const linking = {
  prefixes: ["meetsync://"],
  config: {
    initialRouteName: "Home",
    screens: {
      Join: {
        path: "meeting/:meetingId",
      },
    },
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    LexendDeca_400Regular,
    LexendDeca_700Bold,
  });
  // undefined = still restoring the saved session, null = signed out
  const [authUser, setAuthUser] = useState(undefined);
  // undefined = not loaded yet, {} = signed in but no profile document yet
  const [profile, setProfile] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, setAuthUser), []);

  useEffect(() => {
    setProfile(undefined);
    if (!authUser) return;
    return onSnapshot(
      doc(db, "users", authUser.uid),
      (snap) => setProfile(snap.exists() ? snap.data() : {}),
      () => setProfile({})
    );
  }, [authUser]);

  const ready =
    fontsLoaded &&
    authUser !== undefined &&
    (authUser === null || profile !== undefined);

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) {
    return null;
  }

  const handleLogout = () => {
    signOut(auth).catch(() => {});
  };

  const user = authUser && {
    uid: authUser.uid,
    firstName: profile.firstName || "",
    lastName: profile.lastName || "",
    email: authUser.email || "",
  };
  const availability = profile?.availability || EMPTY_AVAILABILITY;
  const needsAvailability = authUser && !profile.availability;

  return (
    <NavigationContainer linking={linking}>
      <StatusBar style="dark" />
      <Stack.Navigator
        screenOptions={{ headerShown: false }}
        initialRouteName={
          !authUser ? "Login" : needsAvailability ? "Availability" : "Home"
        }
      >
        {!authUser ? (
          <>
            <Stack.Screen name="Login">
              {({ navigation }) => (
                <View style={styles.container}>
                  <LoginScreen
                    onSignUpPress={() => navigation.navigate("SignUp")}
                  />
                </View>
              )}
            </Stack.Screen>

            <Stack.Screen name="SignUp">
              {({ navigation }) => (
                <View style={styles.container}>
                  <SignUpScreen onBack={() => navigation.goBack()} />
                </View>
              )}
            </Stack.Screen>
          </>
        ) : (
          <>
            <Stack.Screen name="Availability">
              {({ navigation }) => (
                <View style={styles.container}>
                  <AvailabilityScreen
                    onNext={() => navigation.replace("Home")}
                  />
                </View>
              )}
            </Stack.Screen>

            <Stack.Screen name="Home">
              {({ navigation }) => (
                <View style={styles.container}>
                  <HomeScreen
                    onCreate={() => navigation.navigate("MeetingCreate")}
                    onJoin={() => navigation.navigate("Join")}
                    onProfile={() => navigation.navigate("Profile")}
                    onLogout={handleLogout}
                    onHome={() => navigation.navigate("Home")}
                    onViewMeeting={(meeting) =>
                      navigation.navigate("MeetingShare", {
                        meeting,
                        from: "home",
                      })
                    }
                  />
                </View>
              )}
            </Stack.Screen>

            <Stack.Screen name="Profile">
              {({ navigation }) => (
                <View style={styles.container}>
                  <ProfileScreen
                    user={user}
                    availability={availability}
                    onSave={() => navigation.navigate("Home")}
                    onHome={() => navigation.navigate("Home")}
                    onLogout={handleLogout}
                    onCreate={() => navigation.navigate("MeetingCreate")}
                  />
                </View>
              )}
            </Stack.Screen>

            <Stack.Screen name="MeetingCreate">
              {({ navigation, route }) => (
                <View style={styles.container}>
                  <MeetingCreationScreen
                    initialMeeting={route.params?.meeting || null}
                    onNext={(meeting) =>
                      navigation.navigate("MeetingShare", {
                        meeting,
                        from: route.params?.from || "create",
                      })
                    }
                    onBack={() => navigation.navigate("Home")}
                  />
                </View>
              )}
            </Stack.Screen>

            <Stack.Screen name="MeetingShare">
              {({ navigation, route }) => (
                <View style={styles.container}>
                  <MeetingSharingScreen
                    meeting={route.params?.meeting || null}
                    onHome={() => navigation.navigate("Home")}
                    onEdit={(meeting) =>
                      navigation.navigate("MeetingCreate", {
                        meeting,
                        from: "share",
                      })
                    }
                  />
                </View>
              )}
            </Stack.Screen>

            <Stack.Screen name="Join">
              {({ navigation, route }) => (
                <View style={styles.container}>
                  <MeetingJoinScreen
                    meetingId={route.params?.meetingId}
                    onBack={() =>
                      navigation.canGoBack()
                        ? navigation.goBack()
                        : navigation.replace("Home")
                    }
                    onSubmit={() => {
                      navigation.navigate("Home");
                    }}
                  />
                </View>
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
