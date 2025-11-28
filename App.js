import { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { useFonts } from "@expo-google-fonts/lexend-deca";
import {
  LexendDeca_400Regular,
  LexendDeca_700Bold,
} from "@expo-google-fonts/lexend-deca";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { auth, db } from "./firebaseConfig";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import AvailabilityScreen from "./screens/AvailabilityScreen";
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MeetingCreationScreen from "./screens/MeetingCreationScreen";
import MeetingSharingScreen from "./screens/MeetingSharingScreen";
import MeetingJoinScreen from "./screens/MeetingJoinScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = useFonts({
    LexendDeca_400Regular,
    LexendDeca_700Bold,
  });
  const emptyAvailability = useMemo(
    () => ({ Sun: [], Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] }),
    []
  );
  const [user, setUser] = useState({ firstName: "", lastName: "", email: "" });
  const [availability, setAvailability] = useState(emptyAvailability);

  const handleLogout = () => {
    setUser({ firstName: "", lastName: "", email: "" });
    setAvailability(emptyAvailability);
    signOut(auth).catch(() => {});
  };

  if (!fontsLoaded) {
    return null;
  }
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login">
          {({ navigation }) => (
            <View style={styles.container}>
              <LoginScreen
                onSignUpPress={() => navigation.navigate("SignUp")}
                onLoginSuccess={async (firebaseUser) => {
                  try {
                    const userRef = doc(db, "users", firebaseUser.uid);
                    const snap = await getDoc(userRef);
                    if (snap.exists()) {
                      const data = snap.data();
                      setUser((prev) => ({
                        ...prev,
                        uid: firebaseUser.uid,
                        firstName: data.firstName || "",
                        lastName: data.lastName || "",
                        email: data.email || firebaseUser.email || "",
                      }));
                      if (data.availability) {
                        setAvailability(data.availability);
                      } else {
                        setAvailability(emptyAvailability);
                      }
                    } else {
                      setUser((prev) => ({
                        ...prev,
                        uid: firebaseUser.uid,
                        email: firebaseUser.email || prev.email,
                      }));
                      setAvailability(emptyAvailability);
                    }
                  } catch (e) {
                    setUser((prev) => ({
                      ...prev,
                      uid: firebaseUser.uid,
                      email: firebaseUser.email || prev.email,
                    }));
                  }
                  navigation.replace("Home");
                }}
              />
            </View>
          )}
        </Stack.Screen>

        <Stack.Screen name="SignUp">
          {({ navigation }) => (
            <View style={styles.container}>
              <SignUpScreen
                onBack={() => navigation.goBack()}
                onNext={(data) => {
                  setUser((prev) => ({ ...prev, ...data }));
                  navigation.navigate("Availability");
                }}
              />
            </View>
          )}
        </Stack.Screen>

        <Stack.Screen name="Availability">
          {({ navigation }) => (
            <View style={styles.container}>
              <AvailabilityScreen
                onNext={(a) => {
                  const normalized = Object.fromEntries(
                    Object.entries(a).map(([k, v]) => [k, Array.from(v)])
                  );
                  setAvailability(normalized);
                  navigation.replace("Home");
                }}
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
                onLogout={() => {
                  handleLogout();
                  navigation.reset({ index: 0, routes: [{ name: "Login" }] });
                }}
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
                onSave={(nextUser, nextAvailability) => {
                  setUser(nextUser);
                  setAvailability(nextAvailability);
                  navigation.navigate("Home");
                }}
                onHome={() => navigation.navigate("Home")}
                onLogout={() => {
                  handleLogout();
                  navigation.reset({ index: 0, routes: [{ name: "Login" }] });
                }}
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
                onBack={() => {
                  if (route.params?.from === "home") {
                    navigation.goBack();
                  } else {
                    navigation.navigate("MeetingCreate");
                  }
                }}
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
          {({ navigation }) => (
            <View style={styles.container}>
              <MeetingJoinScreen
                onBack={() => navigation.goBack()}
                onSubmit={() => {
                  navigation.navigate("Home");
                }}
              />
            </View>
          )}
        </Stack.Screen>
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
