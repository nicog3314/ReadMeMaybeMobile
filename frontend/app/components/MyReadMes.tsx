import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  formatReadmeDate,
  normalizeStoredRepo,
  type StoredRepoRecord,
  timeAgo,
} from "../../lib/storedRepos";

type StoredUser = {
  token?: string;
};

export default function MyReadMes() {
  const router = useRouter();
  const [repos, setRepos] = useState<StoredRepoRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<StoredRepoRecord | null>(
    null
  );

  const getSessionToken = useCallback(async () => {
    const raw = await AsyncStorage.getItem("user_data");

    if (!raw) {
      router.replace("/login");
      return "";
    }

    const storedUser: StoredUser = JSON.parse(raw);

    if (!storedUser.token) {
      await AsyncStorage.removeItem("user_data");
      router.replace("/login");
      return "";
    }

    return storedUser.token;
  }, [router]);

  const loadRepos = useCallback(async () => {
    const token = await getSessionToken();

    if (!token) {
      return [];
    }

    if (!process.env.EXPO_PUBLIC_API_URL) {
      setRepos([]);
      setLoadError("Missing API URL for loading generated repositories.");
      return [];
    }

    const response = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/repos`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.status === 401) {
      await AsyncStorage.removeItem("user_data");
      router.replace("/login");
      return [];
    }

    if (!response.ok) {
      setRepos([]);
      setLoadError(data.message || "Unable to load your generated repositories.");
      return [];
    }

    const nextRepos = Array.isArray(data.repos)
      ? data.repos.map(normalizeStoredRepo)
      : [];

    setRepos(nextRepos);
    setLoadError("");
    return nextRepos;
  }, [getSessionToken, router]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function bootstrapReadmes() {
        setIsLoading(true);

        try {
          await loadRepos();
        } catch {
          if (isActive) {
            setRepos([]);
            setLoadError("Unable to load your generated repositories right now.");
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      void bootstrapReadmes();

      return () => {
        isActive = false;
      };
    }, [loadRepos])
  );

  const filteredRepos = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return repos;
    }

    return repos.filter((repo) => {
      return (
        repo.name.toLowerCase().includes(query) ||
        repo.fullName.toLowerCase().includes(query) ||
        repo.remoteUrl.toLowerCase().includes(query) ||
        repo.languages.some((language) =>
          language.toLowerCase().includes(query)
        )
      );
    });
  }, [repos, search]);

  async function handleRetry() {
    setIsLoading(true);
    setLoadError("");

    try {
      await loadRepos();
    } catch {
      setRepos([]);
      setLoadError("Unable to load your generated repositories right now.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.screen}>
        <View style={styles.bgBlobTopRight} />

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <AppHeader activeRoute="my-readmes" />

          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>My READMEs</Text>
            <Text style={styles.pageSubtitle}>
              Browse the same generated repository records stored for the web
              dashboard. This mobile view is read-only.
            </Text>
          </View>

          <View style={styles.searchCard}>
            <TextInput
              placeholder="Search generated repos..."
              placeholderTextColor="#B7B2F7"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            <Text style={styles.searchMeta}>
              {filteredRepos.length} repo{filteredRepos.length === 1 ? "" : "s"}{" "}
              found
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#1d9e75" />
              <Text style={styles.loadingText}>
                Loading your generated README library...
              </Text>
            </View>
          ) : null}

          {!isLoading && loadError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>
                Couldn&apos;t load repositories
              </Text>
              <Text style={styles.errorText}>{loadError}</Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleRetry}
              >
                <Text style={styles.secondaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!isLoading && !loadError && filteredRepos.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No generated repos yet</Text>
              <Text style={styles.emptyText}>
                Once the website stores generated repositories in the database,
                they will appear here for read-only review in the app.
              </Text>
            </View>
          ) : null}

          {!isLoading && !loadError && filteredRepos.length > 0 ? (
            <View style={styles.repoList}>
              {filteredRepos.map((repo) => {
                const hasReadme = Boolean(repo.readme.trim());

                return (
                  <View key={repo.id} style={styles.repoCard}>
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
                            hasReadme
                              ? styles.doneBadgeText
                              : styles.emptyBadgeText,
                          ]}
                        >
                          {hasReadme ? "Saved" : "Pending"}
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

                    <Text style={styles.repoPreview}>
                      {buildPreview(repo.readme)}
                    </Text>

                    {!hasReadme && repo.failureReason ? (
                      <Text style={styles.failureText}>{repo.failureReason}</Text>
                    ) : null}

                    <View style={styles.repoBottomRow}>
                      <Text style={styles.repoTime}>
                        Updated {timeAgo(repo.updatedAt)}
                      </Text>

                      <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={() => setSelectedRepo(repo)}
                      >
                        <Text style={styles.secondaryButtonText}>View</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })}
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
                  {selectedRepo?.name ?? "README"}
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
              style={styles.previewCard}
              contentContainerStyle={styles.previewCardContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.previewDate}>
                Saved {formatReadmeDate(selectedRepo?.updatedAt ?? "")}
              </Text>
              <Text style={styles.previewText}>
                {selectedRepo?.readme.trim() || "No README content was stored yet."}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 28,
  },
  bgBlobTopRight: {
    position: "absolute",
    top: -80,
    right: -80,
    width: 260,
    height: 260,
    borderRadius: 130,
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
  navItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
  },
  activeNavItem: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#252240",
    borderLeftWidth: 3,
    borderLeftColor: "#1d9e75",
  },
  navText: {
    color: "#7f77dd",
    fontSize: 13,
    fontWeight: "500",
  },
  activeNavText: {
    color: "#eeedfe",
    fontSize: 13,
    fontWeight: "700",
  },
  pageHeader: {
    marginBottom: 20,
  },
  pageTitle: {
    color: "#eeedfe",
    fontSize: 26,
    fontWeight: "600",
  },
  pageSubtitle: {
    color: "#d4d2f8",
    marginTop: 4,
    lineHeight: 20,
  },
  searchCard: {
    backgroundColor: "#1c1a2e",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: "#141125",
    borderWidth: 0.5,
    borderColor: "#332d59",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#eeedfe",
    marginBottom: 10,
  },
  searchMeta: {
    color: "#afa9ec",
    fontSize: 12,
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
  errorCard: {
    backgroundColor: "#1c1a2e",
    borderWidth: 0.5,
    borderColor: "#7a3a57",
    borderRadius: 12,
    padding: 18,
  },
  errorTitle: {
    color: "#eeedfe",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  errorText: {
    color: "#e0a4be",
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  emptyCard: {
    backgroundColor: "#1c1a2e",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 12,
    padding: 18,
  },
  emptyTitle: {
    color: "#eeedfe",
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 8,
  },
  emptyText: {
    color: "#afa9ec",
    fontSize: 13,
    lineHeight: 20,
  },
  repoList: {
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
  statusBadge: {
    borderWidth: 0.5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: "flex-start",
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
    marginBottom: 14,
  },
  failureText: {
    color: "#e0a4be",
    fontSize: 10,
    lineHeight: 16,
    marginBottom: 12,
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
  secondaryButton: {
    backgroundColor: "#252240",
    borderWidth: 0.5,
    borderColor: "#3c3489",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  secondaryButtonText: {
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
  previewCard: {
    paddingHorizontal: 18,
  },
  previewCardContent: {
    paddingTop: 14,
    paddingBottom: 22,
  },
  previewDate: {
    color: "#5dcaa5",
    fontSize: 11,
    marginBottom: 14,
  },
  previewText: {
    color: "#e8e6ff",
    fontSize: 13,
    lineHeight: 22,
  },
});
