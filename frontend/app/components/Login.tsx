import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";

export default function Login() {
  const router = useRouter();

  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [message, setMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  async function doLogin() {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/login`,
        {
          method: "POST",
          body: JSON.stringify({
            Email: loginName,
            Password: loginPassword,
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const res = await response.json();

      if (!response.ok) {
        setMessage(res.message || "Login failed");
      } else {
        const user = {
          firstName: res.user.FirstName,
          lastName: res.user.LastName,
          id: res.user._id,
          token: res.jwtToken,
        };

        await AsyncStorage.setItem("user_data", JSON.stringify(user));
        setMessage("");
        router.replace("/dashboard");
      }
    } catch (error: any) {
      Alert.alert("Login Error", error.toString());
    }
  }

  async function doRegister() {
    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/auth/register`,
        {
          method: "POST",
          body: JSON.stringify({
            FirstName: firstName,
            LastName: lastName,
            Login: loginName,
            Email: loginName,
            Password: loginPassword,
          }),
          headers: { "Content-Type": "application/json" },
        }
      );

      const res = await response.json();

      if (!response.ok) {
        setMessage(res.message || "Registration failed");
      } else {
        setMessage("Account created! You can now sign in.");
        setIsCreateAccount(false);
      }
    } catch (error: any) {
      Alert.alert("Registration Error", error.toString());
    }
  }

  async function handleAuthSubmit() {
    if (isCreateAccount) {
      await doRegister();
      return;
    }

    await doLogin();
  }

  const isErrorMessage =
    message.toLowerCase().includes("invalid") ||
    message.toLowerCase().includes("incorrect") ||
    message.toLowerCase().includes("failed") ||
    message.toLowerCase().includes("in use");

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.leftBlob} />
        <View style={styles.topRightBlob} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoRow}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
              alt="ReadMeMaybe logo"
            />
            <Text style={styles.logoText}>ReadMeMaybe</Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>pre-v1.0 - AI-powered ReadMe&apos;s</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isCreateAccount ? "Hello, new user" : "Welcome back"}
            </Text>
            <Text style={styles.formSubtitle}>
              {isCreateAccount
                ? "Create a new account to continue"
                : "Sign in to your account to continue"}
            </Text>

            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[
                  styles.tabButton,
                  !isCreateAccount && styles.activeTabButton,
                ]}
                onPress={() => {
                  setIsCreateAccount(false);
                  setMessage("");
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    !isCreateAccount && styles.activeTabText,
                  ]}
                >
                  Sign in
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.tabButton,
                  isCreateAccount && styles.activeTabButton,
                ]}
                onPress={() => {
                  setIsCreateAccount(true);
                  setMessage("");
                }}
              >
                <Text
                  style={[
                    styles.tabText,
                    isCreateAccount && styles.activeTabText,
                  ]}
                >
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {isCreateAccount && (
              <View style={styles.nameRow}>
                <View style={styles.nameField}>
                  <Text style={styles.label}>FIRST NAME</Text>
                  <TextInput
                    placeholder="Your First Name"
                    placeholderTextColor="#B7B2F7"
                    value={firstName}
                    onChangeText={setFirstName}
                    style={styles.input}
                  />
                </View>

                <View style={styles.nameField}>
                  <Text style={styles.label}>LAST NAME</Text>
                  <TextInput
                    placeholder="Your Last Name"
                    placeholderTextColor="#B7B2F7"
                    value={lastName}
                    onChangeText={setLastName}
                    style={styles.input}
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                placeholder="you@example.com"
                placeholderTextColor="#B7B2F7"
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
                placeholderTextColor="#B7B2F7"
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
              style={styles.submitButton}
              onPress={handleAuthSubmit}
            >
              <Text style={styles.submitButtonText}>
                {isCreateAccount ? "Create Account" : "Sign in"}
              </Text>
            </TouchableOpacity>

            {message ? (
              <View
                style={[
                  styles.messageBox,
                  isErrorMessage
                    ? styles.errorMessageBox
                    : styles.successMessageBox,
                ]}
              >
                <Text style={styles.messageText}>{message}</Text>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#08071a",
  },
  screen: {
    flex: 1,
    backgroundColor: "#08071a",
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 36,
  },
  leftBlob: {
    position: "absolute",
    left: -90,
    bottom: 80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(83,74,183,0.12)",
  },
  topRightBlob: {
    position: "absolute",
    right: -110,
    top: -70,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(20,29,37,1)",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 16,
    marginRight: 12,
  },
  logoText: {
    color: "#EEEDFE",
    fontSize: 24,
    fontWeight: "600",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(83,74,183,0.4)",
    backgroundColor: "#1c1a2e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 20,
  },
  badgeText: {
    color: "#D4D2F8",
    fontSize: 12,
  },
  heroSection: {
    marginBottom: 28,
  },
  heroTitle: {
    color: "#EEEDFE",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "500",
  },
  heroAccent: {
    color: "#1D9E75",
    fontSize: 30,
    lineHeight: 38,
    fontWeight: "500",
  },
  heroDescription: {
    color: "#D4D2F8",
    fontSize: 16,
    lineHeight: 24,
    marginTop: 14,
    maxWidth: 320,
  },
  featureList: {
    marginBottom: 28,
    gap: 18,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  featureDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  featureText: {
    flex: 1,
    color: "#D4D2F8",
    fontSize: 14,
    lineHeight: 20,
  },
  featureBold: {
    color: "#EEEDFE",
    fontWeight: "600",
  },
  formCard: {
    borderWidth: 1,
    borderColor: "#252240",
    backgroundColor: "rgba(28,26,46,0.35)",
    borderRadius: 20,
    padding: 20,
  },
  formTitle: {
    color: "#EEEDFE",
    fontSize: 28,
    fontWeight: "500",
  },
  formSubtitle: {
    color: "#D4D2F8",
    fontSize: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#252240",
    backgroundColor: "#1c1a2e",
    padding: 4,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#5A53B7",
  },
  tabText: {
    color: "#D4D2F8",
    fontSize: 16,
    fontWeight: "500",
  },
  activeTabText: {
    color: "#EEEDFE",
  },
  nameRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  nameField: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    color: "#D4D2F8",
    fontSize: 13,
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3C3489",
    backgroundColor: "#1c1a2e",
    color: "#EEEDFE",
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  forgotButton: {
    alignSelf: "flex-end",
    marginBottom: 16,
  },
  forgotText: {
    color: "#D4D2F8",
    fontSize: 14,
  },
  submitButton: {
    marginTop: 6,
    borderRadius: 12,
    backgroundColor: "#0F6B57",
    paddingVertical: 14,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#EEEDFE",
    fontSize: 20,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#252240",
  },
  dividerText: {
    color: "#D4D2F8",
    fontSize: 14,
  },
  oauthButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3A336F",
    backgroundColor: "#1B1935",
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 12,
  },
  oauthButtonText: {
    color: "#EEEDFE",
    fontSize: 18,
  },
  messageBox: {
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  errorMessageBox: {
    borderColor: "rgba(248,113,113,0.5)",
    backgroundColor: "rgba(239,68,68,0.1)",
  },
  successMessageBox: {
    borderColor: "rgba(29,158,117,0.5)",
    backgroundColor: "rgba(29,158,117,0.1)",
  },
  messageText: {
    color: "#EEEDFE",
    fontSize: 14,
  },
});
