import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Image } from "expo-image";

export default function Login() {
  const router = useRouter();

  const [isCreateAccount, setIsCreateAccount] = useState(false);
  const [message, setMessage] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loginName, setLoginName] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  async function doLogin() {
    const obj = { login: loginName, password: loginPassword };
    const js = JSON.stringify(obj);

    try {
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/login`,
        {
          method: "POST",
          body: js,
          headers: { "Content-Type": "application/json" },
        }
      );

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
        router.replace("/dashboard");
      }
    } catch (error: any) {
      Alert.alert("Login Error", error.toString());
    }
  }

  async function handleAuthSubmit() {
    if (isCreateAccount) {
      setMessage("Not yet implemented.");
      return;
    }

    await doLogin();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.bgBlobTopLeft} />
        <View style={styles.bgBlobRight} />
        <View style={styles.bgBlobBottomLeft} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoRow}>
            <Image
              source={require("../../assets/images/icon.png")}
              style={styles.logo}
              contentFit="cover"
            />
            <Text style={styles.logoText}>ReadMeMaybe</Text>
          </View>

          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              pre-v1.0 - AI-powered ReadMe&apos;s
            </Text>
          </View>

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
                  placeholderTextColor="#534AB7"
                  value={firstName}
                  onChangeText={setFirstName}
                  style={styles.input}
                />
              </View>

              <View style={styles.nameField}>
                <Text style={styles.label}>LAST NAME</Text>
                <TextInput
                  placeholder="Your Last Name"
                  placeholderTextColor="#534AB7"
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

          <TouchableOpacity style={styles.submitButton} onPress={handleAuthSubmit}>
            <Text style={styles.submitButtonText}>
              {isCreateAccount ? "Create Account" : "Sign in"}
            </Text>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity style={styles.oauthButton}>
            <Text style={styles.oauthButtonText}>Continue with Github</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.oauthButton}>
            <Text style={styles.oauthButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {message ? (
            <View
              style={[
                styles.messageBox,
                message.includes("incorrect")
                  ? styles.errorMessageBox
                  : styles.infoMessageBox,
              ]}
            >
              <Text style={styles.messageText}>{message}</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#070617",
  },
  screen: {
    flex: 1,
    backgroundColor: "#070617",
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
  },
  bgBlobTopLeft: {
    position: "absolute",
    top: -110,
    left: -120,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(127,119,221,0.10)",
  },
  bgBlobRight: {
    position: "absolute",
    top: 230,
    right: -140,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: "rgba(29,158,117,0.08)",
  },
  bgBlobBottomLeft: {
    position: "absolute",
    bottom: -120,
    left: -100,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(83,74,183,0.07)",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 16,
  },
  logoText: {
    color: "#EEEDFE",
    fontSize: 24,
    fontWeight: "500",
  },
  badge: {
    alignSelf: "flex-start",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(83,74,183,0.4)",
    backgroundColor: "#1c1a2e",
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginBottom: 36,
  },
  badgeText: {
    color: "#7F77DD",
    fontSize: 12,
  },
  formTitle: {
    color: "#EEEDFE",
    fontSize: 30,
    fontWeight: "500",
  },
  formSubtitle: {
    color: "#7F77DD",
    fontSize: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#1c1a2e",
    borderWidth: 1,
    borderColor: "#252240",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  activeTabButton: {
    backgroundColor: "#5A53B7",
  },
  tabText: {
    color: "#7F77DD",
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
    color: "#AFA9EC",
    fontSize: 13,
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    width: "100%",
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
    color: "#7F77DD",
    fontSize: 14,
  },
  submitButton: {
    marginTop: 8,
    width: "100%",
    borderRadius: 12,
    backgroundColor: "#1D8E75",
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
    color: "#7F77DD",
    fontSize: 14,
  },
  oauthButton: {
    width: "100%",
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
  infoMessageBox: {
    borderColor: "rgba(127,119,221,0.5)",
    backgroundColor: "rgba(127,119,221,0.1)",
  },
  messageText: {
    color: "#EEEDFE",
    fontSize: 14,
  },
});