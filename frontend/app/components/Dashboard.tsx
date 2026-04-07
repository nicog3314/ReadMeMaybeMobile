import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

export default function Dashboard() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLasttName] = useState("");
  const userInitials = [firstName, lastName]
    .map((name) => name.trim().charAt(0))
    .filter(Boolean)
    .join("")
    .toUpperCase();

  // Getting User Info
  useEffect(() => {
    async function loadUser() {
      const raw = await AsyncStorage.getItem("user_data");

      if (!raw) {
        router.replace("/login");
        return;
      }

      const user = JSON.parse(raw);
      setFirstName(user.firstName ?? "");
      setLasttName(user.lastName ?? "");
    }

    loadUser();
  }, [router]);

  // Handling logout
  async function handleLogout() {
    await AsyncStorage.removeItem("user_data");
    router.replace("/login");
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.bgBlobTopRight} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header / Brand */}
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

            <View style={styles.topNav}>
              <TouchableOpacity style={styles.activeNavItem}>
                <View style={styles.dashboardIcon}>
                  <View style={styles.dashboardSquare} />
                  <View style={styles.dashboardSquare} />
                  <View style={styles.dashboardSquare} />
                  <View style={styles.dashboardSquare} />
                </View>
                <Text style={styles.activeNavText}>Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.navItem}>
                <View style={styles.reposIcon}>
                  <View style={styles.repoLineFull} />
                  <View style={styles.repoLineMedium} />
                  <View style={styles.repoLineShort} />
                </View>
                <Text style={styles.navText}>My Repos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => router.push("/about")}
              >
                <View style={styles.aboutIconCircle}>
                  <Text style={styles.aboutIconText}>i</Text>
                </View>
                <Text style={styles.navText}>About Us</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Page header */}
          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Dashboard</Text>
            <Text style={styles.pageSubtitle}>Welcome back, {firstName}</Text>
          </View>

          {/* Stat cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                READMEs{"\n"}Generated
              </Text>
              <Text style={styles.statValue}>12</Text>
              <Text style={styles.statAccent}>+2 this week</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                Repos{"\n"}Analyzed
              </Text>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statMuted}>2 in progress</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                Saved{"\n"}Versions
              </Text>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statAccent}>across all repos</Text>
            </View>
          </View>

          {/* Submit repo */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Submit a repo</Text>

            <View style={styles.repoSubmitCard}>
              <TextInput
                placeholder="https://github.com/user/repo-name"
                placeholderTextColor="#3c3489"
                style={styles.repoInput}
                autoCapitalize="none"
              />

              <TouchableOpacity style={styles.generateButton}>
                <Text style={styles.generateButtonText}>Generate README</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent activity */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Recent activity</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.activityList}>
              <RepoCard
                name="portfolio-site"
                url="github.com/janedev/portfolio-site"
                tags={["React", "TypeScript", "Vite"]}
                status="Done"
                statusVariant="done"
                time="2 mins ago"
              />

              <RepoCard
                name="express-auth-api"
                url="github.com/janedev/express-auth-api"
                tags={["Node.js", "Express", "MongoDB"]}
                status="Processing"
                statusVariant="processing"
                time="5 mins ago"
                disabled
              />

              <RepoCard
                name="data-viz-dashboard"
                url="github.com/janedev/data-viz-dashboard"
                tags={["Python", "Flask", "D3.js"]}
                status="Done"
                statusVariant="done"
                time="Yesterday"
              />
            </View>
          </View>

          {/* User footer */}
          <View style={styles.userFooter}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{userInitials || "JD"}</Text>
            </View>
            <Text style={styles.userName}>{[firstName, lastName].filter(Boolean).join(" ") || "Jone Doe"}</Text>

            <TouchableOpacity style={styles.viewButton} onPress={handleLogout}>
              <Text style={styles.viewButtonText}>Log out</Text>
            </TouchableOpacity>
          </View>
          
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function RepoCard({
  name,
  url,
  tags,
  status,
  statusVariant,
  time,
  disabled = false,
}: {
  name: string;
  url: string;
  tags: string[];
  status: string;
  statusVariant: "done" | "processing";
  time: string;
  disabled?: boolean;
}) {
  return (
    <View style={styles.repoCard}>
      <View style={styles.repoTopRow}>
        <View style={styles.repoInfo}>
          <Text style={styles.repoName}>{name}</Text>
          <Text style={styles.repoUrl} numberOfLines={1}>
            {url}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            statusVariant === "done"
              ? styles.doneBadge
              : styles.processingBadge,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              statusVariant === "done"
                ? styles.doneBadgeText
                : styles.processingBadgeText,
            ]}
          >
            {status}
          </Text>
        </View>
      </View>

      <View style={styles.tagRow}>
        {tags.map((tag) => (
          <View key={tag} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
      </View>

      <View style={styles.repoBottomRow}>
        <Text style={styles.repoTime}>{time}</Text>

        <TouchableOpacity
          disabled={disabled}
          style={[
            styles.viewButton,
            disabled && styles.viewButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.viewButtonText,
              disabled && styles.viewButtonTextDisabled,
            ]}
          >
            View README
          </Text>
        </TouchableOpacity>
      </View>
    </View>
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  bgBlobTopRight: {
    position: "absolute",
    top: -70,
    right: -80,
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(29,158,117,0.07)",
  },

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

  pageHeader: {
    marginBottom: 24,
  },
  pageTitle: {
    color: "#eeedfe",
    fontSize: 26,
    fontWeight: "500",
  },
  pageSubtitle: {
    color: "#7f77dd",
    fontSize: 13,
    marginTop: 4,
  },

  statsGrid: {
    gap: 12,
    marginBottom: 28,
  },
  statCard: {
    backgroundColor: "#1c1a2e",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    color: "#7f77dd",
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    lineHeight: 15,
  },
  statValue: {
    color: "#eeedfe",
    fontSize: 28,
    fontWeight: "500",
    marginTop: 10,
  },
  statAccent: {
    color: "#5dcaa5",
    fontSize: 10,
    marginTop: 4,
  },
  statMuted: {
    color: "#afa9ec",
    fontSize: 10,
    marginTop: 4,
  },

  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: "#eeedfe",
    fontSize: 17,
    fontWeight: "500",
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  viewAllText: {
    color: "#7f77dd",
    fontSize: 12,
  },

  repoSubmitCard: {
    backgroundColor: "transparent",
    gap: 12,
  },
  repoInput: {
    backgroundColor: "#1c1a2e",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: "#eeedfe",
    fontSize: 13,
  },
  generateButton: {
    backgroundColor: "#534ab7",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  generateButtonText: {
    color: "#eeedfe",
    fontSize: 15,
    fontWeight: "600",
  },

  activityList: {
    gap: 14,
  },
  repoCard: {
    backgroundColor: "#1c1a2e",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 12,
    padding: 16,
  },
  repoTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  repoInfo: {
    flex: 1,
    minWidth: 0,
  },
  repoName: {
    color: "#eeedfe",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  repoUrl: {
    color: "#7f77dd",
    fontSize: 10,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: "#252240",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tagText: {
    color: "#afa9ec",
    fontSize: 9,
  },

  statusBadge: {
    borderWidth: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  doneBadge: {
    backgroundColor: "#9fe1cb",
    borderColor: "#085041",
  },
  processingBadge: {
    backgroundColor: "#252240",
    borderColor: "#3c3489",
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: "600",
  },
  doneBadgeText: {
    color: "#085041",
  },
  processingBadgeText: {
    color: "#afa9ec",
  },

  repoBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  repoTime: {
    color: "#7f77dd",
    fontSize: 10,
  },
  viewButton: {
    backgroundColor: "#252240",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 12,
  },
  viewButtonDisabled: {
    backgroundColor: "#1c1a2d",
    borderColor: "#676670",
  },
  viewButtonText: {
    color: "#eeedfe",
    fontSize: 13,
    fontWeight: "500",
  },
  viewButtonTextDisabled: {
    color: "#676670",
  },

  userFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingTop: 6,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#534ab7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  userAvatarText: {
    color: "#eeedfe",
    fontSize: 12,
    fontWeight: "600",
  },
  userName: {
    color: "#eeedfe",
    fontSize: 13,
    fontWeight: "500",
  },
});
