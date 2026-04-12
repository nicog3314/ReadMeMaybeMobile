import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AppHeader from "./AppHeader";

// Team data
const team = [
  { initials: "SA", name: "Santiago Aguilar", role: "Project Manager / Deployment", color: "#1d9e75", text: "#f5fffb" },
  { initials: "RC", name: "Reyjay Collazo", role: "Project Manager", color: "#1d9e75", text: "#f5fffb" },
  { initials: "AS", name: "Aiden Sperr", role: "Frontend Developer", color: "#7f77dd", text: "#f8f7ff" },
  { initials: "NG", name: "Nicole Gonzalez", role: "Mobile Developer", color: "#1d9e75", text: "#f5fffb" },
  { initials: "KD", name: "Kiara Delgado", role: "Auth Developer / Slides", color: "#afa9ec", text: "#1e1947" },
  { initials: "SY", name: "Selin Yilmaz", role: "Database Engineer / AI", color: "#7f77dd", text: "#f8f7ff" },
  { initials: "WS", name: "William Sharpe", role: "AI Engineer", color: "#1d9e75", text: "#f5fffb" },
];

export default function About() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.bgBlob} />

        <ScrollView contentContainerStyle={styles.content}>
          <AppHeader activeRoute="about" />

          <View style={styles.header}>
            <Text style={styles.title}>About Us</Text>
            <Text style={styles.subtitle}>The team behind ReadMeMaybe</Text>
          </View>

          {/* Intro */}
          <Text style={styles.intro}>
            We’re a team of seven UCF students building ReadMeMaybe!
          </Text>

          {/* Team Cards */}
          <View style={styles.teamGrid}>
            {team.map((member) => (
              <View key={member.initials} style={styles.card}>
                
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: member.color },
                  ]}
                >
                  <Text style={{ color: member.text, fontWeight: "600" }}>
                    {member.initials}
                  </Text>
                </View>

                <Text style={styles.name}>{member.name}</Text>

                <View
                  style={[
                    styles.roleBadge,
                    { borderColor: member.color },
                  ]}
                >
                  <Text style={[styles.roleText, { color: member.color }]}>
                    {member.role}
                  </Text>
                </View>

              </View>
            ))}
          </View>

        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#13111e",
  },
  screen: {
    flex: 1,
    backgroundColor: "#13111e",
  },
  content: {
    padding: 20,
  },

  bgBlob: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(29,158,117,0.08)",
  },

  header: {
    marginBottom: 12,
  },
  title: {
    color: "#eeedfe",
    fontSize: 26,
    fontWeight: "600",
  },
  subtitle: {
    color: "#d4d2f8",
    marginTop: 4,
  },

  intro: {
    color: "#d4d2f8",
    marginBottom: 20,
  },

  teamGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },

  card: {
    width: "48%",
    backgroundColor: "#1c1a2e",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "#3c3489",
  },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  name: {
    color: "#eeedfe",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },

  roleBadge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 0.5,
  },

  roleText: {
    fontSize: 10,
    textAlign: "center",
  },
});
