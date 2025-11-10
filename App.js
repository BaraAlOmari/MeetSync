import { useMemo, useState } from "react";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View } from "react-native";
import { useFonts } from "@expo-google-fonts/lexend-deca";
import {
  LexendDeca_400Regular,
  LexendDeca_700Bold,
} from "@expo-google-fonts/lexend-deca";
import LoginScreen from "./screens/LoginScreen";
import SignUpScreen from "./screens/SignUpScreen";
import AvailabilityScreen from "./screens/AvailabilityScreen";
import HomeScreen from "./screens/HomeScreen";
import ProfileScreen from "./screens/ProfileScreen";
import MeetingCreationScreen from "./screens/MeetingCreationScreen";
import MeetingSharingScreem from "./screens/MeetingSharingScreen";
import MeetingJoinScreen from "./screens/MeetingJoinScreen";

export default function App() {
  const [fontsLoaded] = useFonts({
    LexendDeca_400Regular,
    LexendDeca_700Bold,
  });
  const [route, setRoute] = useState("login");
  const emptyAvailability = useMemo(
    () => ({ Sun: [], Mon: [], Tue: [], Wed: [], Thu: [], Fri: [], Sat: [] }),
    []
  );
  const [user, setUser] = useState({ firstName: "", lastName: "", email: "" });
  const [availability, setAvailability] = useState(emptyAvailability);

  const handleLogout = () => {
    setUser({ firstName: "", lastName: "", email: "" });
    setAvailability(emptyAvailability);
    setRoute("login");
  };

  if (!fontsLoaded) {
    return null;
  }
  return (
    <View style={styles.container}>
      {route === "login" && (
        <LoginScreen
          onSignUpPress={() => setRoute("signup")}
          onLoginSuccess={() => setRoute("home")}
        />
      )}
      {route === "signup" && (
        <SignUpScreen
          onBack={() => setRoute("login")}
          onNext={(data) => {
            setUser((prev) => ({ ...prev, ...data }));
            setRoute("availability");
          }}
        />
      )}
      {route === "availability" && (
        <AvailabilityScreen
          onNext={(a) => {
            const normalized = Object.fromEntries(
              Object.entries(a).map(([k, v]) => [k, Array.from(v)])
            );
            setAvailability(normalized);
            setRoute("home");
          }}
        />
      )}
      {route === "home" && (
        <HomeScreen
          onCreate={() => setRoute("meetingCreate")}
          onJoin={() => setRoute("join")}
          onProfile={() => setRoute("profile")}
          onLogout={handleLogout}
          onHome={() => setRoute("home")}
        />
      )}
      {route === "profile" && (
        <ProfileScreen
          user={user}
          availability={availability}
          onSave={(nextUser, nextAvailability) => {
            setUser(nextUser);
            setAvailability(nextAvailability);
            setRoute("home");
          }}
          onHome={() => setRoute("home")}
          onLogout={handleLogout}
          onCreate={() => setRoute("meetingCreate")}
        />
      )}
      {route === "meetingCreate" && (
        <MeetingCreationScreen
          onNext={() => setRoute("meetingShare")}
          onBack={() => setRoute("home")}
        />
      )}
      {route === "meetingShare" && (
        <MeetingSharingScreem
          onHome={() => setRoute("home")}
          onBack={() => setRoute("meetingCreate")}
        />
      )}
      {route === "join" && (
        <MeetingJoinScreen
          onBack={() => setRoute("home")}
          onSubmit={(id) => {
            console.log("Joining with ID:", id);
            setRoute("home");
          }}
        />
      )}
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});
