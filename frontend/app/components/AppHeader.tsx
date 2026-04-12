import React, { useCallback, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";

type HeaderRoute = "dashboard" | "my-readmes" | "about";

type StoredUser = {
  firstName?: string;
  lastName?: string;
};

export default function AppHeader({ activeRoute }: { activeRoute: HeaderRoute }) {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const userInitials = useMemo(() => {
    return [firstName, lastName]
      .map((name) => name.trim().charAt(0))
      .filter(Boolean)
      .join("")
      .toUpperCase();
  }, [firstName, lastName]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function loadUser() {
        const raw = await AsyncStorage.getItem("user_data");

        if (!raw || !isActive) {
          return;
        }

        const storedUser: StoredUser = JSON.parse(raw);
        setFirstName(storedUser.firstName ?? "");
        setLastName(storedUser.lastName ?? "");
      }

      void loadUser();

      return () => {
        isActive = false;
      };
    }, [])
  );

  async function handleLogout() {
    await AsyncStorage.removeItem("user_data");
    router.replace("/login");
  }

  return (
    <View style={styles.headerCard}>
      <View style={styles.logoRow}>
        <View style={styles.logoBox}>
          <View style={styles.logoLineFull} />
          <View style={styles.logoLineShort} />
          <View style={styles.logoLineMedium} />
          <View style={styles.logoLineTiny} />
        </View>
        <Text style={styles.brandText}>ReadMeMaybe</Text>
      </View>

      <View style={styles.userFooter}>
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>{userInitials || "RM"}</Text>
        </View>

        <View style={styles.userTextBlock}>
          <Text style={styles.userName}>
            {[firstName, lastName].filter(Boolean).join(" ") || "ReadMe User"}
          </Text>
          <Text style={styles.userCaption}>Signed in on this device</Text>
        </View>

        <TouchableOpacity style={styles.footerButton} onPress={handleLogout}>
          <Text style={styles.footerButtonText}>Log out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.topNav}>
        <TouchableOpacity
          style={activeRoute === "dashboard" ? styles.activeNavItem : styles.navItem}
          onPress={() => router.push("/dashboard")}
        >
          <View style={styles.dashboardIcon}>
            <View style={styles.dashboardSquare} />
            <View style={styles.dashboardSquare} />
            <View style={styles.dashboardSquare} />
            <View style={styles.dashboardSquare} />
          </View>
          <Text
            style={
              activeRoute === "dashboard" ? styles.activeNavText : styles.navText
            }
          >
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={activeRoute === "my-readmes" ? styles.activeNavItem : styles.navItem}
          onPress={() => router.push("/my-readmes")}
        >
          <View style={styles.reposIcon}>
            <View style={styles.repoLineFull} />
            <View style={styles.repoLineMedium} />
            <View style={styles.repoLineShort} />
          </View>
          <Text
            style={
              activeRoute === "my-readmes" ? styles.activeNavText : styles.navText
            }
          >
            Saved READMEs
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={activeRoute === "about" ? styles.activeNavItem : styles.navItem}
          onPress={() => router.push("/about")}
        >
          <View style={styles.aboutIconCircle}>
            <Text style={styles.aboutIconText}>i</Text>
          </View>
          <Text style={activeRoute === "about" ? styles.activeNavText : styles.navText}>
            About Us
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: "#1c1a2e",
    borderWidth: 1,
    borderColor: "#252240",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  logoBox: {
    width: 33,
    height: 32,
    backgroundColor: "#1d9e75",
    borderRadius: 8,
    paddingHorizontal: 7,
    justifyContent: "center",
    marginRight: 12,
  },
  logoLineFull: {
    height: 2,
    backgroundColor: "#d9d9d9",
    borderRadius: 999,
    width: "100%",
    marginBottom: 3,
  },
  logoLineShort: {
    height: 2,
    backgroundColor: "#d9d9d9",
    borderRadius: 999,
    width: "65%",
    opacity: 0.8,
    marginBottom: 3,
  },
  logoLineMedium: {
    height: 2,
    backgroundColor: "#d9d9d9",
    borderRadius: 999,
    width: "80%",
    opacity: 0.6,
    marginBottom: 3,
  },
  logoLineTiny: {
    height: 2,
    backgroundColor: "#d9d9d9",
    borderRadius: 999,
    width: "50%",
    opacity: 0.4,
  },
  brandText: {
    color: "#eeedfe",
    fontSize: 22,
    fontWeight: "500",
  },
  userFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#171428",
    borderWidth: 0.5,
    borderColor: "#2a2650",
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#534ab7",
    alignItems: "center",
    justifyContent: "center",
  },
  userAvatarText: {
    color: "#eeedfe",
    fontSize: 12,
    fontWeight: "600",
  },
  userTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    color: "#eeedfe",
    fontSize: 13,
    fontWeight: "500",
  },
  userCaption: {
    color: "#7f77dd",
    fontSize: 10,
    marginTop: 2,
  },
  footerButton: {
    backgroundColor: "#252240",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  footerButtonText: {
    color: "#eeedfe",
    fontSize: 13,
    fontWeight: "500",
  },
  topNav: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  activeNavItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#252240",
    borderLeftWidth: 3,
    borderLeftColor: "#1d9e75",
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  dashboardIcon: {
    width: 15,
    height: 15,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
  },
  dashboardSquare: {
    width: 6,
    height: 6,
    backgroundColor: "#1d9e75",
    borderRadius: 1.5,
  },
  reposIcon: {
    width: 15,
    justifyContent: "center",
  },
  repoLineFull: {
    height: 3,
    width: "100%",
    backgroundColor: "#7f77dd",
    borderRadius: 999,
    marginBottom: 3,
  },
  repoLineMedium: {
    height: 3,
    width: "80%",
    backgroundColor: "#7f77dd",
    borderRadius: 999,
    marginBottom: 3,
  },
  repoLineShort: {
    height: 3,
    width: "65%",
    backgroundColor: "#7f77dd",
    borderRadius: 999,
  },
  aboutIconCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: "#7f77dd",
    alignItems: "center",
    justifyContent: "center",
  },
  aboutIconText: {
    color: "#7f77dd",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 10,
  },
  activeNavText: {
    color: "#eeedfe",
    fontSize: 13,
    fontWeight: "700",
  },
  navText: {
    color: "#7f77dd",
    fontSize: 13,
    fontWeight: "500",
  },
});
