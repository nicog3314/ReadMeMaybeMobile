import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import AppHeader from "./AppHeader";
import {
  buildPreview,
  type DashboardStats,
  formatReadmeDate,
  formatStatDate,
  getRepoTimestamp,
  normalizeStoredRepo,
  type StoredRepoRecord,
  timeAgo,
} from "../lib/storedRepos";

type StoredUser = {
  firstName?: string;
  token?: string;
};

const emptyStats: DashboardStats = {
  totalReadmes: 0,
  totalRepos: 0,
  thisWeekCount: 0,
};

export default function Dashboard() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [repos, setRepos] = useState<StoredRepoRecord[]>([]);
  const [stats, setStats] = useState<DashboardStats>(emptyStats);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<StoredRepoRecord | null>(
    null
  );

  const recentRepos = useMemo(() => {
    return [...repos]
      .sort((left, right) => getRepoTimestamp(right) - getRepoTimestamp(left))
      .slice(0, 3);
  }, [repos]);

  const latestRepo = recentRepos[0] ?? null;

  const loadDashboardData = useCallback(async () => {
    const raw = await AsyncStorage.getItem("user_data");

    if (!raw) {
      router.replace("/login");
      return;
    }

    const storedUser: StoredUser = JSON.parse(raw);
    setFirstName(storedUser.firstName ?? "");

    if (!storedUser.token) {
      await AsyncStorage.removeItem("user_data");
      router.replace("/login");
      return;
    }

    if (!process.env.EXPO_PUBLIC_API_URL) {
      setRepos([]);
      setStats(emptyStats);
      setLoadError("Missing API URL for loading your generated repositories.");
      return;
    }

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/repos`, {
      headers: {
        Authorization: `Bearer ${storedUser.token}`,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      await AsyncStorage.removeItem("user_data");
      router.replace("/login");
      return;
    }

    if (!response.ok) {
      setRepos([]);
      setStats(emptyStats);
      setLoadError(data.message || "Unable to load your generated repositories.");
      return;
    }

    const nextRepos = Array.isArray(data.repos)
      ? data.repos.map(normalizeStoredRepo)
      : [];

    setRepos(nextRepos);
    setStats(data.stats ?? emptyStats);
    setLoadError("");
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function bootstrapDashboard() {
        setIsLoading(true);

        try {
          await loadDashboardData();
        } catch {
          if (isActive) {
            setRepos([]);
            setStats(emptyStats);
            setLoadError(
              "Unable to load your generated repositories right now."
            );
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void bootstrapDashboard();

      return () => {
        isActive = false;
      };
    }, [loadDashboardData])
  );

  async function handleRetry() {
    setIsLoading(true);
    setLoadError("");

    try {
      await loadDashboardData();
    } catch {
      setRepos([]);
      setStats(emptyStats);
      setLoadError("Unable to load your generated repositories right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.bgBlobTopRight} />
        <View style={styles.bgBlobBottomLeft} />
        <View style={styles.bgBlobBottomRight} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <AppHeader activeRoute="dashboard" />

          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Dashboard</Text>
            <Text style={styles.pageSubtitle}>
              Welcome back, {firstName || "there"}.
            </Text>
          </View>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                READMEs{"\n"}
                Generated
              </Text>
              <Text style={styles.statValue}>
                {isLoading ? "-" : stats.totalReadmes}
              </Text>
              <Text style={styles.statAccentText}>
                {isLoading ? "" : `+${stats.thisWeekCount} active this week`}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                Repos{"\n"}
                Saved
              </Text>
              <Text style={styles.statValue}>
                {isLoading ? "-" : stats.totalRepos}
              </Text>
              <Text style={styles.statMutedText}>synced from the website</Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>
                Last{"\n"}
                Generated
              </Text>
              <Text style={styles.statValue}>
                {isLoading ? "-" : formatStatDate(latestRepo?.updatedAt ?? "")}
              </Text>
              <Text style={styles.statMutedText} numberOfLines={1}>
                {isLoading ? "" : latestRepo?.name || "no activity yet"}
              </Text>
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent activity</Text>

            <TouchableOpacity onPress={() => router.push("/my-readmes")}>
              <Text style={styles.sectionLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.activityList}>
              {[0, 1, 2].map((index) => (
                <View key={index} style={styles.loadingCard}>
                  <ActivityIndicator color="#1d9e75" />
                  <Text style={styles.loadingText}>Loading recent activity...</Text>
                </View>
              ))}
            </View>
          ) : null}

          {!isLoading && loadError ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageTitle}>
                Couldn&apos;t load repositories
              </Text>
              <Text style={styles.messageText}>{loadError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!isLoading && !loadError && repos.length === 0 ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageTitle}>No generated repos yet</Text>
              <Text style={styles.messageText}>
                The app is now reading the website&apos;s saved repository records.
                If you generated READMEs on the web and still see nothing here,
                make sure the mobile app is pointing at the same backend and
                database.
              </Text>
            </View>
          ) : null}

          {!isLoading && !loadError && recentRepos.length > 0 ? (
            <View style={styles.activityList}>
              {recentRepos.map((repo) => (
                <RecentActivityCard
                  key={repo.id}
                  repo={repo}
                  onView={() => setSelectedRepo(repo)}
                />
              ))}
            </View>
          ) : null}

          
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={selectedRepo !== null}
        onRequestClose={() => setSelectedRepo(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>
                  {selectedRepo?.name || "README"}
                </Text>
                <Text style={styles.modalMeta}>
                  {selectedRepo?.remoteUrl ||
                    selectedRepo?.fullName ||
                    "Saved repository"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedRepo(null)}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={styles.modalContentInner}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.modalDate}>
                Saved {formatReadmeDate(selectedRepo?.updatedAt ?? "")}
              </Text>
              <Text style={styles.modalMarkdown}>
                {selectedRepo?.readme || "No README content was stored yet."}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RecentActivityCard({
  repo,
  onView,
}: {
  repo: StoredRepoRecord;
  onView: () => void;
}) {
  const hasReadme = Boolean(repo.readme.trim());

  return (
    <View style={styles.repoCard}>
      <View style={styles.repoTopRow}>
        <View style={styles.repoInfo}>
          <Text style={styles.repoName}>{repo.name}</Text>
          <Text style={styles.repoUrl} numberOfLines={1}>
            {(repo.remoteUrl || repo.fullName || repo.name).replace(
              /^https?:\/\//,
              ""
            )}
          </Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            hasReadme ? styles.doneBadge : styles.emptyBadge,
          ]}
        >
          <Text
            style={[
              styles.statusBadgeText,
              hasReadme ? styles.doneBadgeText : styles.emptyBadgeText,
            ]}
          >
            {hasReadme ? "Done" : "Pending"}
          </Text>
        </View>
      </View>

      {repo.languages.length > 0 ? (
        <View style={styles.tagRow}>
          {repo.languages.slice(0, 3).map((language) => (
            <View key={`${repo.id}-${language}`} style={styles.tag}>
              <Text style={styles.tagText}>{language}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.repoPreview}>{buildPreview(repo.readme)}</Text>

      <View style={styles.repoBottomRow}>
        <View style={styles.repoMetaStack}>
          <Text style={styles.repoTime}>{timeAgo(repo.updatedAt)}</Text>
          <Text style={styles.repoMetaCaption}>
            {repo.generationNumber > 0
              ? `v${repo.generationNumber}`
              : repo.visibility}
          </Text>
        </View>

        <TouchableOpacity style={styles.cardButton} onPress={onView}>
          <Text style={styles.cardButtonText}>View README</Text>
        </TouchableOpacity>
      </View>

      {!hasReadme && repo.failureReason ? (
        <Text style={styles.failureText}>{repo.failureReason}</Text>
      ) : null}
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
    backgroundColor: "rgba(29,158,117,0.10)",
  },
  bgBlobBottomLeft: {
    position: "absolute",
    bottom: -90,
    left: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(83,74,183,0.12)",
  },
  bgBlobBottomRight: {
    position: "absolute",
    bottom: -60,
    right: 40,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: "rgba(29,158,117,0.08)",
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
    lineHeight: 19,
  },
  statsGrid: {
    gap: 12,
    marginBottom: 24,
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
    marginBottom: 10,
  },
  statValue: {
    color: "#eeedfe",
    fontSize: 26,
    fontWeight: "500",
    marginBottom: 6,
  },
  statAccentText: {
    color: "#5dcaa5",
    fontSize: 11,
  },
  statMutedText: {
    color: "#afa9ec",
    fontSize: 11,
  },
  generateCard: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#171328",
    borderWidth: 1,
    borderColor: "#30295a",
    borderRadius: 24,
    padding: 20,
    marginBottom: 26,
  },
  generateGlow: {
    position: "absolute",
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(83,74,183,0.18)",
  },
  generateHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  generateHeaderText: {
    flex: 1,
  },
  generateEyebrow: {
    color: "#7f77dd",
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    marginBottom: 6,
  },
  generateTitle: {
    color: "#f6f4ff",
    fontSize: 22,
    fontWeight: "500",
    marginBottom: 8,
  },
  generateText: {
    color: "#c8c2ef",
    fontSize: 13,
    lineHeight: 20,
  },
  webOnlyBadge: {
    backgroundColor: "#163229",
    borderWidth: 0.5,
    borderColor: "#2b6b59",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  webOnlyBadgeText: {
    color: "#9fe1cb",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  featureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 18,
  },
  featurePill: {
    backgroundColor: "#221d38",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  featurePillText: {
    color: "#afa9ec",
    fontSize: 11,
  },
  generateActions: {
    gap: 10,
  },
  primaryButton: {
    backgroundColor: "#534ab7",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#eeedfe",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: "#141125",
    borderWidth: 0.5,
    borderColor: "#332d59",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 13,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#afa9ec",
    fontSize: 14,
    fontWeight: "500",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#eeedfe",
    fontSize: 17,
    fontWeight: "500",
  },
  sectionLink: {
    color: "#7f77dd",
    fontSize: 12,
    fontWeight: "500",
  },
  loadingCard: {
    backgroundColor: "#1c1a2e",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 12,
    padding: 24,
    alignItems: "center",
    gap: 14,
  },
  loadingText: {
    color: "#afa9ec",
    fontSize: 13,
    textAlign: "center",
  },
  messageCard: {
    backgroundColor: "#1c1a2e",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 12,
    padding: 18,
    marginBottom: 12,
  },
  messageTitle: {
    color: "#eeedfe",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  messageText: {
    color: "#afa9ec",
    fontSize: 13,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: "flex-start",
    marginTop: 14,
    backgroundColor: "#252240",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  retryButtonText: {
    color: "#eeedfe",
    fontSize: 13,
    fontWeight: "500",
  },
  activityList: {
    gap: 14,
    marginBottom: 18,
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
  repoPreview: {
    color: "#d4d2f8",
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 16,
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
  emptyBadge: {
    backgroundColor: "#2f1b28",
    borderColor: "#7a3a57",
  },
  statusBadgeText: {
    fontSize: 8,
    fontWeight: "600",
  },
  doneBadgeText: {
    color: "#085041",
  },
  emptyBadgeText: {
    color: "#e0a4be",
  },
  repoBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  repoMetaStack: {
    flex: 1,
    gap: 2,
  },
  repoTime: {
    color: "#7f77dd",
    fontSize: 10,
  },
  repoMetaCaption: {
    color: "#afa9ec",
    fontSize: 9,
  },
  cardButton: {
    backgroundColor: "#252240",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  cardButtonText: {
    color: "#eeedfe",
    fontSize: 13,
    fontWeight: "500",
  },
  failureText: {
    color: "#e0a4be",
    fontSize: 10,
    lineHeight: 16,
    marginTop: 10,
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
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(12, 10, 20, 0.82)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    maxHeight: "82%",
    backgroundColor: "#171428",
    borderWidth: 1,
    borderColor: "#2a2650",
    borderRadius: 18,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#252240",
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    color: "#eeedfe",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  modalMeta: {
    color: "#7f77dd",
    fontSize: 11,
  },
  modalCloseButton: {
    backgroundColor: "#252240",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalCloseButtonText: {
    color: "#eeedfe",
    fontSize: 12,
    fontWeight: "500",
  },
  modalContent: {
    paddingHorizontal: 18,
  },
  modalContentInner: {
    paddingTop: 14,
    paddingBottom: 22,
  },
  modalDate: {
    color: "#5dcaa5",
    fontSize: 11,
    marginBottom: 14,
  },
  modalMarkdown: {
    color: "#e8e6ff",
    fontSize: 13,
    lineHeight: 22,
  },
});
