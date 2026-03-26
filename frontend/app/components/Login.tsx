import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
export default function Login() {
  const [message, setMessage] = useState("");
  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [fullName, setFullName] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  async function doLogin(): Promise<void> {
    const obj = { login: loginName, password: loginPassword };
    const js = JSON.stringify(obj);

    try {
      const response = await fetch("http://YOUR_BACKEND_URL/api/login", {
        method: "POST",
        body: js,
        headers: { "Content-Type": "application/json" },
      });

      const res = await response.json();

      if (res.id <= 0) {
        setMessage("User/Password combination incorrect");
      } else {
        const user = {
          firstName: res.firstName,
          lastName: res.lastName,
          id: res.id,
        };

        await AsyncStorage.setItem("user_data", JSON.stringify(user));
        setMessage("");
        router.push("/dashboard");
      }
    } catch (error: any) {
      Alert.alert("Login Error", error.toString());
    }
  }

  async function handleAuthSubmit(): Promise<void> {
    if (isCreateAccount) {
      setMessage("Not yet implemented.");
      return;
    }

    await doLogin();
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <View style={styles.leftPanel}>
          <View style={styles.circleLeft} />

          <View style={styles.leftContent}>
            <View style={styles.logoRow}>
              <Image
                source={require("../../assets/images/icon.png")}
                style={styles.logo}
                resizeMode="cover"
              />
              <Text style={styles.brandText}>ReadMeMaybe</Text>
            </View>

            <View style={styles.badge}>
              <Text style={styles.badgeText}>pre-v1.0 - AI-powered ReadMe’s</Text>
            </View>

            <View style={styles.heroSection}>
              <Text style={styles.heroTitle}>Give your repositories</Text>
              <Text style={[styles.heroTitle, styles.heroAccent]}>
                descriptive ReadMe’s
              </Text>
              <Text style={styles.heroTitle}>in seconds</Text>

              <Text style={styles.heroDescription}>
                Paste a GitHub URL and let AI analyze your codebase and generate a
                polished README, ready to display.
              </Text>
            </View>

            <View style={styles.features}>
              <FeatureDot
                color="#1D9E75"
                title="Smart structure detection"
                text="scans folders, files, and dependencies automatically."
              />
              <FeatureDot
                color="#7F77DD"
                title="Markdown output"
                text="copy, preview, or export your README instantly."
              />
              <FeatureDot
                color="#534AB7"
                title="Version history"
                text="every generation is saved so you can compare and restore."
              />
            </View>
          </View>
        </View>

        <View style={styles.rightPanel}>
          <View style={styles.circleRight} />

          <View style={styles.rightContent}>
            <Text style={styles.heading}>
              {isCreateAccount ? "Hello, new user" : "Welcome back"}
            </Text>

            <Text style={styles.subheading}>
              {isCreateAccount
                ? "Create a new account to continue"
                : "Sign in to your account to continue"}
            </Text>

            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  !isCreateAccount && styles.tabButtonActive,
                ]}
                onPress={() => {
                  setIsCreateAccount(false);
                  setMessage("");
                }}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    !isCreateAccount && styles.tabButtonTextActive,
                  ]}
                >
                  Sign in
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  isCreateAccount && styles.tabButtonActive,
                ]}
                onPress={() => {
                  setIsCreateAccount(true);
                  setMessage("");
                }}
              >
                <Text
                  style={[
                    styles.tabButtonText,
                    isCreateAccount && styles.tabButtonTextActive,
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {isCreateAccount && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NAME</Text>
                <TextInput
                  placeholder="Your Name"
                  placeholderTextColor="#534AB7"
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.input}
                />
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor="#534AB7"
                value={loginName}
                onChangeText={setLoginName}
                style={styles.input}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>PASSWORD</Text>
              <TextInput
                placeholder="........"
                placeholderTextColor="#534AB7"
                value={loginPassword}
                onChangeText={setLoginPassword}
                style={styles.input}
                secureTextEntry
              />
            </View>

            {!isCreateAccount && (
              <TouchableOpacity style={styles.forgotButton}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleAuthSubmit}
            >
              <Text style={styles.primaryButtonText}>
                {isCreateAccount ? "Create Account" : "Sign in"}
              </Text>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Continue with Github</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Continue with Google</Text>
            </TouchableOpacity>

            <Text style={styles.footerText}>
              Don&apos;t have an account?{" "}
              <Text style={styles.footerAccent}>Create one free</Text>
            </Text>

            {!!message && (
              <View
                style={[
                  styles.messageBox,
                  message.includes("incorrect")
                    ? styles.messageError
                    : styles.messageInfo,
                ]}
              >
                <Text style={styles.messageText}>{message}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

function FeatureDot({
  color,
  title,
  text,
}: {
  color: string;
  title: string;
  text: string;
}) {
  return (
    <View style={styles.featureRow}>
      <View style={[styles.featureDot, { backgroundColor: color }]} />
      <Text style={styles.featureText}>
        <Text style={styles.featureTitle}>{title}</Text> — {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    flexDirection: Platform.OS === "web" ? "row" : "column",
    backgroundColor: "#08071a",
    minHeight: "100%",
  },
  leftPanel: {
    flex: 1,
    backgroundColor: "#08071a",
    borderRightWidth: Platform.OS === "web" ? 1 : 0,
    borderRightColor: "#252240",
    overflow: "hidden",
  },
  rightPanel: {
    flex: 1,
    backgroundColor: "#08071a",
    overflow: "hidden",
  },
  leftContent: {
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 32,
  },
  rightContent: {
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 32,
    maxWidth: 540,
    width: "100%",
    alignSelf: "center",
  },
  circleLeft: {
    position: "absolute",
    left: -80,
    bottom: 56,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(83,74,183,0.12)",
  },
  circleRight: {
    position: "absolute",
    left: 80,
    top: -150,
    width: 392,
    height: 392,
    borderRadius: 196,
    backgroundColor: "#141D25",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 14,
  },
  brandText: {
    color: "#EEEDFE",
    fontSize: 24,
    fontWeight: "500",
  },
  badge: {
    marginTop: 24,
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(83,74,183,0.4)",
    backgroundColor: "#1c1a2e",
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  badgeText: {
    color: "#7F77DD",
    fontSize: 12,
  },
  heroSection: {
    marginTop: 24,
  },
  heroTitle: {
    color: "#EEEDFE",
    fontSize: 30,
    lineHeight: 38,
  },
  heroAccent: {
    color: "#1D9E75",
  },
  heroDescription: {
    marginTop: 16,
    maxWidth: 340,
    color: "#7F77DD",
    fontSize: 16,
    lineHeight: 24,
  },
  features: {
    marginTop: 32,
    gap: 24,
    maxWidth: 360,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureDot: {
    marginTop: 6,
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  featureText: {
    flex: 1,
    color: "#afa9ec",
    fontSize: 15,
    lineHeight: 22,
  },
  featureTitle: {
    color: "#EEEDFE",
    fontWeight: "600",
  },
  heading: {
    color: "#EEEDFE",
    fontSize: 28,
    fontWeight: "600",
  },
  subheading: {
    marginTop: 8,
    color: "#7F77DD",
    fontSize: 16,
  },
  tabRow: {
    marginTop: 32,
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#252240",
    backgroundColor: "#1c1a2e",
    padding: 4,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: "#5A53B7",
  },
  tabButtonText: {
    color: "#7F77DD",
    fontSize: 16,
  },
  tabButtonTextActive: {
    color: "#EEEDFE",
    fontWeight: "600",
  },
  inputGroup: {
    marginTop: 20,
  },
  label: {
    marginBottom: 8,
    color: "#AFA9EC",
    fontSize: 13,
    letterSpacing: 1,
  },
  input: {
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3C3489",
    backgroundColor: "#1c1a2e",
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#EEEDFE",
    fontSize: 16,
  },
  forgotButton: {
    marginTop: 10,
    alignSelf: "flex-end",
  },
  forgotText: {
    color: "#7F77DD",
    fontSize: 14,
  },
  primaryButton: {
    marginTop: 18,
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#1D8E75",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#EEEDFE",
    fontSize: 20,
    fontWeight: "600",
  },
  dividerRow: {
    marginTop: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#252240",
  },
  dividerText: {
    color: "#7F77DD",
    fontSize: 14,
  },
  secondaryButton: {
    marginTop: 14,
    width: "100%",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3A336F",
    backgroundColor: "#1B1935",
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#EEEDFE",
    fontSize: 18,
  },
  footerText: {
    marginTop: 16,
    textAlign: "center",
    color: "#7F77DD",
    fontSize: 14,
  },
  footerAccent: {
    color: "#AFA9EC",
  },
  messageBox: {
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  messageError: {
    borderColor: "rgba(248,113,113,0.5)",
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  messageInfo: {
    borderColor: "rgba(127,119,221,0.5)",
    backgroundColor: "rgba(127,119,221,0.1)",
  },
  messageText: {
    color: "#EEEDFE",
    fontSize: 14,
  },
});