import React, { useEffect, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

type StoredUser = {
  firstName?: string;
  lastName?: string;
  token?: string;
};

type StoredReadme = {
  id: string;
  title: string;
  repository: string;
  repositoryUrl: string;
  content: string;
  tags: string[];
  createdAt: string;
};

function normalizeReadme(raw: any, index: number): StoredReadme {
  return {
    id: String(raw?.id ?? raw?._id ?? `readme-${index}`),
    title:
      raw?.title ??
      raw?.name ??
      raw?.repository ??
      raw?.repositoryName ??
      `README ${index + 1}`,
    repository: raw?.repository ?? raw?.repositoryName ?? raw?.title ?? "",
    repositoryUrl: raw?.repositoryUrl ?? raw?.repoUrl ?? raw?.url ?? "",
    content: raw?.content ?? raw?.markdown ?? raw?.readme ?? raw?.text ?? "",
    tags: Array.isArray(raw?.tags)
      ? raw.tags.filter((tag: unknown) => typeof tag === "string")
      : [],
    createdAt: String(raw?.createdAt ?? raw?.updatedAt ?? ""),
  };
}

function formatReadmeDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "Saved recently";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildPreview(content: string) {
  const preview = content.replace(/\s+/g, " ").trim();

  if (!preview) {
    return "Saved README content will appear here when available.";
  }

  return preview.length > 140 ? `${preview.slice(0, 140)}...` : preview;
}

export default function Dashboard() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [readmes, setReadmes] = useState<StoredReadme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedReadme, setSelectedReadme] = useState<StoredReadme | null>(
    null
  );

  const userInitials = [firstName, lastName]
    .map((name) => name.trim().charAt(0))
    .filter(Boolean)
    .join("")
    .toUpperCase();

  async function loadDashboardData() {
    const raw = await AsyncStorage.getItem("user_data");

    if (!raw) {
      router.replace("/login");
      return;
    }

    const storedUser: StoredUser = JSON.parse(raw);
    setFirstName(storedUser.firstName ?? "");
    setLastName(storedUser.lastName ?? "");

    if (!storedUser.token) {
      await AsyncStorage.removeItem("user_data");
      router.replace("/login");
      return;
    }

    if (!process.env.EXPO_PUBLIC_API_URL) {
      setReadmes([]);
      setLoadError("Missing API URL for loading saved READMEs.");
      return;
    }

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/auth/readmes`,
      {
        headers: {
          Authorization: `Bearer ${storedUser.token}`,
        },
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      await AsyncStorage.removeItem("user_data");
      router.replace("/login");
      return;
    }

    if (!response.ok) {
      setReadmes([]);
      setLoadError(data.message || "Unable to load your saved READMEs.");
      return;
    }

    const nextReadmes = Array.isArray(data.readmes)
      ? data.readmes.map(normalizeReadme)
      : [];

    setReadmes(nextReadmes);
    setLoadError("");
  }

  useEffect(() => {
    let isMounted = true;

    async function bootstrapDashboard() {
      try {
        await loadDashboardData();
      } catch (error) {
        if (isMounted) {
          setReadmes([]);
          setLoadError("Unable to load your saved READMEs right now.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    bootstrapDashboard();

    return () => {
      isMounted = false;
    };
  }, [router]);

  async function handleRetry() {
    setIsLoading(true);
    setLoadError("");

    try {
      await loadDashboardData();
    } catch (error) {
      setReadmes([]);
      setLoadError("Unable to load your saved READMEs right now.");
    } finally {
      setIsLoading(false);
    }
  }

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
                <Text style={styles.navText}>Saved READMEs</Text>
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

          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>Dashboard</Text>
            <Text style={styles.pageSubtitle}>
              Welcome back, {firstName || "there"}. View your saved READMEs
              below.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Saved READMEs</Text>

            {isLoading ? (
              <View style={styles.loadingCard}>
                <ActivityIndicator color="#1d9e75" />
                <Text style={styles.loadingText}>
                  Loading your saved README library...
                </Text>
              </View>
            ) : null}

            {!isLoading && loadError ? (
              <View style={styles.messageCard}>
                <Text style={styles.messageTitle}>Couldn&apos;t load READMEs</Text>
                <Text style={styles.messageText}>{loadError}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {!isLoading && !loadError && readmes.length === 0 ? (
              <View style={styles.messageCard}>
                <Text style={styles.messageTitle}>No saved READMEs yet</Text>
                <Text style={styles.messageText}>
                  This dashboard now only shows READMEs already stored on your
                  account.
                </Text>
              </View>
            ) : null}

            {!isLoading && !loadError && readmes.length > 0 ? (
              <View style={styles.activityList}>
                {readmes.map((readme) => (
                  <RepoCard
                    key={readme.id}
                    readme={readme}
                    onView={() => setSelectedReadme(readme)}
                  />
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.userFooter}>
            <View style={styles.userAvatar}>
              <Text style={styles.userAvatarText}>{userInitials || "RM"}</Text>
            </View>
            <Text style={styles.userName}>
              {[firstName, lastName].filter(Boolean).join(" ") || "ReadMe User"}
            </Text>

            <TouchableOpacity style={styles.viewButton} onPress={handleLogout}>
              <Text style={styles.viewButtonText}>Log out</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      <Modal
        animationType="slide"
        transparent
        visible={selectedReadme !== null}
        onRequestClose={() => setSelectedReadme(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>
                  {selectedReadme?.title || "README"}
                </Text>
                <Text style={styles.modalMeta}>
                  {selectedReadme?.repositoryUrl ||
                    selectedReadme?.repository ||
                    "Saved README"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setSelectedReadme(null)}
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
                Saved {formatReadmeDate(selectedReadme?.createdAt ?? "")}
              </Text>
              <Text style={styles.modalMarkdown}>
                {selectedReadme?.content || "No README content was stored yet."}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function RepoCard({
  readme,
  onView,
}: {
  readme: StoredReadme;
  onView: () => void;
}) {
  return (
    <View style={styles.repoCard}>
      <View style={styles.repoTopRow}>
        <View style={styles.repoInfo}>
          <Text style={styles.repoName}>{readme.title}</Text>
          <Text style={styles.repoUrl} numberOfLines={1}>
            {readme.repositoryUrl || readme.repository || "Saved to your account"}
          </Text>
        </View>

        <View style={[styles.statusBadge, styles.doneBadge]}>
          <Text style={[styles.statusBadgeText, styles.doneBadgeText]}>Saved</Text>
        </View>
      </View>

      {readme.tags.length > 0 ? (
        <View style={styles.tagRow}>
          {readme.tags.map((tag) => (
            <View key={`${readme.id}-${tag}`} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text style={styles.repoPreview}>{buildPreview(readme.content)}</Text>

      <View style={styles.repoBottomRow}>
        <Text style={styles.repoTime}>{formatReadmeDate(readme.createdAt)}</Text>

        <TouchableOpacity style={styles.viewButton} onPress={onView}>
          <Text style={styles.viewButtonText}>View README</Text>
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
    lineHeight: 19,
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
  statusBadgeText: {
    fontSize: 8,
    fontWeight: "600",
  },
  doneBadgeText: {
    color: "#085041",
  },
  repoBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  repoTime: {
    color: "#7f77dd",
    fontSize: 10,
    flex: 1,
  },
  viewButton: {
    backgroundColor: "#252240",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  viewButtonText: {
    color: "#eeedfe",
    fontSize: 13,
    fontWeight: "500",
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
    flex: 1,
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
