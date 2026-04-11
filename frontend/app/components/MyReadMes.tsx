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

type StoredUser = {
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
  updatedAt: string;
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
    updatedAt: String(raw?.updatedAt ?? raw?.createdAt ?? ""),
  };
}

function timeAgo(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "recently";
  }

  const diff = Date.now() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) {
    return "just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days}d ago`;
}

function buildPreview(content: string) {
  const preview = content.replace(/\s+/g, " ").trim();

  if (!preview) {
    return "This README does not have any saved content yet.";
  }

  return preview.length > 140 ? `${preview.slice(0, 140)}...` : preview;
}

export default function MyReadMes() {
  const router = useRouter();
  const [readmes, setReadmes] = useState<StoredReadme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedReadme, setSelectedReadme] = useState<StoredReadme | null>(
    null
  );
  const [draft, setDraft] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  const showActionMessage = useCallback((message: string) => {
    setActionMessage(message);
    setTimeout(() => setActionMessage(""), 2500);
  }, []);

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

  const loadReadmes = useCallback(async () => {
    const token = await getSessionToken();

    if (!token) {
      return [];
    }

    if (!process.env.EXPO_PUBLIC_API_URL) {
      setReadmes([]);
      setLoadError("Missing API URL for loading saved READMEs.");
      return [];
    }

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/auth/readmes`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (response.status === 401) {
      await AsyncStorage.removeItem("user_data");
      router.replace("/login");
      return [];
    }

    if (!response.ok) {
      setReadmes([]);
      setLoadError(data.message || "Unable to load your saved READMEs.");
      return [];
    }

    const nextReadmes = Array.isArray(data.readmes)
      ? data.readmes.map(normalizeReadme)
      : [];

    setReadmes(nextReadmes);
    setLoadError("");
    return nextReadmes;
  }, [getSessionToken, router]);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      async function bootstrapReadmes() {
        setIsLoading(true);

        try {
          await loadReadmes();
        } catch (error) {
          if (isActive) {
            setReadmes([]);
            setLoadError("Unable to load your saved READMEs right now.");
          }
        } finally {
          if (isActive) {
            setIsLoading(false);
          }
        }
      }

      bootstrapReadmes();

      return () => {
        isActive = false;
      };
    }, [loadReadmes])
  );

  const filteredReadmes = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return readmes;
    }

    return readmes.filter((readme) => {
      return (
        readme.title.toLowerCase().includes(query) ||
        readme.repository.toLowerCase().includes(query) ||
        readme.repositoryUrl.toLowerCase().includes(query) ||
        readme.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [readmes, search]);

  function openReadme(readme: StoredReadme) {
    setSelectedReadme(readme);
    setDraft(readme.content);
  }

  function closeReadme() {
    setSelectedReadme(null);
    setDraft("");
  }

  function replaceReadme(
    updatedReadme: StoredReadme,
    shouldSyncSelectedReadme = false
  ) {
    setReadmes((currentReadmes) =>
      currentReadmes.map((readme) =>
        readme.id === updatedReadme.id ? updatedReadme : readme
      )
    );

    if (shouldSyncSelectedReadme) {
      setSelectedReadme(updatedReadme);
      setDraft(updatedReadme.content);
    }
  }

  async function handleDelete(readmeId: string) {
    const token = await getSessionToken();

    if (!token || !process.env.EXPO_PUBLIC_API_URL) {
      return;
    }

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/auth/readmes/${readmeId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showActionMessage(data.message || "Unable to delete this README.");
      return;
    }

    setReadmes((currentReadmes) =>
      currentReadmes.filter((readme) => readme.id !== readmeId)
    );

    if (selectedReadme?.id === readmeId) {
      closeReadme();
    }

    showActionMessage("README removed from the list.");
  }

  async function handleRegenerate(readme: StoredReadme) {
    const token = await getSessionToken();

    if (!token || !process.env.EXPO_PUBLIC_API_URL) {
      return;
    }

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/auth/readmes/${readme.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: readme.title,
          repository: readme.repository,
          repositoryUrl: readme.repositoryUrl,
          tags: readme.tags,
          content: readme.content
            ? `${readme.content}\n\n<!-- regenerated -->`
            : `# ${readme.title}\n\nAuto-generated README.`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showActionMessage(data.message || "Unable to regenerate this README.");
      return;
    }

    const updatedReadme = normalizeReadme(data.readme ?? {}, 0);
    replaceReadme(updatedReadme, selectedReadme?.id === readme.id);
    showActionMessage(`Regenerated ${readme.title} successfully.`);
  }

  async function handleSave() {
    if (!selectedReadme) {
      return;
    }

    const token = await getSessionToken();

    if (!token || !process.env.EXPO_PUBLIC_API_URL) {
      return;
    }

    const response = await fetch(
      `${process.env.EXPO_PUBLIC_API_URL}/api/auth/readmes/${selectedReadme.id}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: selectedReadme.title,
          repository: selectedReadme.repository,
          repositoryUrl: selectedReadme.repositoryUrl,
          tags: selectedReadme.tags,
          content: draft,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      showActionMessage(data.message || "Unable to save this README.");
      return;
    }

    const updatedReadme = normalizeReadme(data.readme ?? {}, 0);
    replaceReadme(updatedReadme, true);
    showActionMessage("README saved.");
  }

  async function handleRetry() {
    setIsLoading(true);
    setLoadError("");

    try {
      await loadReadmes();
    } catch (error) {
      setReadmes([]);
      setLoadError("Unable to load your saved READMEs right now.");
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
              <TouchableOpacity
                style={styles.navItem}
                onPress={() => router.push("/dashboard")}
              >
                <Text style={styles.navText}>Dashboard</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.activeNavItem}>
                <Text style={styles.activeNavText}>My READMEs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.navItem}
                onPress={() => router.push("/about")}
              >
                <Text style={styles.navText}>About Us</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.pageHeader}>
            <Text style={styles.pageTitle}>My READMEs</Text>
            <Text style={styles.pageSubtitle}>
              Browse, edit, and manage the same saved READMEs shown on your
              dashboard.
            </Text>
          </View>

          <View style={styles.searchCard}>
            <TextInput
              placeholder="Search saved READMEs..."
              placeholderTextColor="#B7B2F7"
              value={search}
              onChangeText={setSearch}
              style={styles.searchInput}
            />
            <Text style={styles.searchMeta}>
              {filteredReadmes.length} README
              {filteredReadmes.length === 1 ? "" : "s"} found
            </Text>
          </View>

          {actionMessage ? (
            <View style={styles.messageCard}>
              <Text style={styles.messageText}>{actionMessage}</Text>
            </View>
          ) : null}

          {isLoading ? (
            <View style={styles.loadingCard}>
              <ActivityIndicator color="#1d9e75" />
              <Text style={styles.loadingText}>
                Loading your saved README library...
              </Text>
            </View>
          ) : null}

          {!isLoading && loadError ? (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>Couldn&apos;t load READMEs</Text>
              <Text style={styles.errorText}>{loadError}</Text>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleRetry}
              >
                <Text style={styles.secondaryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {!isLoading && !loadError && filteredReadmes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No saved READMEs yet</Text>
              <Text style={styles.emptyText}>
                Once a README is stored on your account, it will appear here and
                on the dashboard.
              </Text>
            </View>
          ) : null}

          {!isLoading && !loadError && filteredReadmes.length > 0 ? (
            <View style={styles.repoList}>
              {filteredReadmes.map((readme) => {
                const hasContent = Boolean(readme.content.trim());

                return (
                  <View key={readme.id} style={styles.repoCard}>
                    <View style={styles.repoTopRow}>
                      <View style={styles.repoInfo}>
                        <Text style={styles.repoName}>{readme.title}</Text>
                        <Text style={styles.repoUrl} numberOfLines={1}>
                          {readme.repositoryUrl ||
                            readme.repository ||
                            "Saved to your account"}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          hasContent ? styles.doneBadge : styles.emptyBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            hasContent
                              ? styles.doneBadgeText
                              : styles.emptyBadgeText,
                          ]}
                        >
                          {hasContent ? "Saved" : "Draft"}
                        </Text>
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

                    <Text style={styles.repoPreview}>
                      {buildPreview(readme.content)}
                    </Text>

                    <View style={styles.repoBottomRow}>
                      <Text style={styles.repoTime}>
                        Updated {timeAgo(readme.updatedAt || readme.createdAt)}
                      </Text>

                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.secondaryButton}
                          onPress={() => openReadme(readme)}
                        >
                          <Text style={styles.secondaryButtonText}>View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.secondaryButton}
                          onPress={() => handleRegenerate(readme)}
                        >
                          <Text style={styles.secondaryButtonText}>
                            Regenerate
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.deleteButton}
                          onPress={() => handleDelete(readme.id)}
                        >
                          <Text style={styles.deleteButtonText}>Delete</Text>
                        </TouchableOpacity>
                      </View>
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
        visible={selectedReadme !== null}
        onRequestClose={closeReadme}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>
                  {selectedReadme?.title ?? "README"}
                </Text>
                <Text style={styles.modalMeta}>
                  {selectedReadme?.repositoryUrl ||
                    selectedReadme?.repository ||
                    "Saved repository"}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={closeReadme}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.editorLabel}>Markdown</Text>
            <TextInput
              multiline
              value={draft}
              onChangeText={setDraft}
              style={styles.editorInput}
              placeholder="README content will appear here."
              placeholderTextColor="#B7B2F7"
            />

            <Text style={styles.editorLabel}>Preview</Text>
            <ScrollView
              style={styles.previewCard}
              contentContainerStyle={styles.previewCardContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.previewText}>
                {draft.trim() || "Nothing to preview yet."}
              </Text>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleSave}
              >
                <Text style={styles.secondaryButtonText}>Save</Text>
              </TouchableOpacity>

              {selectedReadme ? (
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => handleRegenerate(selectedReadme)}
                >
                  <Text style={styles.primaryButtonText}>Regenerate</Text>
                </TouchableOpacity>
              ) : null}
            </View>
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
    backgroundColor: "rgba(29,158,117,0.08)",
  },
  headerCard: {
    backgroundColor: "#171428",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#252240",
    padding: 18,
    marginBottom: 20,
    gap: 18,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#1d9e75",
    justifyContent: "center",
    paddingHorizontal: 7,
    gap: 3,
  },
  logoLineFull: {
    height: 3,
    width: "100%",
    borderRadius: 999,
    backgroundColor: "#d9d9d9",
  },
  logoLineShort: {
    height: 3,
    width: "60%",
    borderRadius: 999,
    backgroundColor: "#d9d9d9",
  },
  logoLineMedium: {
    height: 3,
    width: "78%",
    borderRadius: 999,
    backgroundColor: "#d9d9d9",
  },
  logoLineTiny: {
    height: 3,
    width: "45%",
    borderRadius: 999,
    backgroundColor: "#d9d9d9",
  },
  brandText: {
    color: "#eeedfe",
    fontSize: 22,
    fontWeight: "600",
  },
  topNav: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  navItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#252240",
  },
  activeNavItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#1d9e75",
  },
  navText: {
    color: "#d4d2f8",
    fontSize: 14,
    fontWeight: "500",
  },
  activeNavText: {
    color: "#eeedfe",
    fontSize: 14,
    fontWeight: "600",
  },
  pageHeader: {
    marginBottom: 18,
  },
  pageTitle: {
    color: "#eeedfe",
    fontSize: 30,
    fontWeight: "600",
    marginBottom: 6,
  },
  pageSubtitle: {
    color: "#d4d2f8",
    fontSize: 15,
    lineHeight: 22,
  },
  searchCard: {
    backgroundColor: "#1c1a2e",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252240",
    padding: 16,
    marginBottom: 14,
  },
  searchInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3C3489",
    backgroundColor: "#13111e",
    color: "#EEEDFE",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 10,
  },
  searchMeta: {
    color: "#d4d2f8",
    fontSize: 13,
  },
  messageCard: {
    marginBottom: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(29,158,117,0.5)",
    backgroundColor: "rgba(29,158,117,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageText: {
    color: "#eeedfe",
    fontSize: 14,
  },
  loadingCard: {
    backgroundColor: "#1c1a2e",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252240",
    padding: 18,
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  loadingText: {
    color: "#d4d2f8",
    fontSize: 14,
  },
  errorCard: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.4)",
    padding: 18,
    marginBottom: 14,
    gap: 10,
  },
  errorTitle: {
    color: "#eeedfe",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#f2c6c6",
    fontSize: 14,
    lineHeight: 21,
  },
  emptyCard: {
    backgroundColor: "#1c1a2e",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252240",
    padding: 18,
    marginBottom: 14,
    gap: 8,
  },
  emptyTitle: {
    color: "#eeedfe",
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    color: "#d4d2f8",
    fontSize: 14,
    lineHeight: 21,
  },
  repoList: {
    gap: 14,
  },
  repoCard: {
    backgroundColor: "#1c1a2e",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#252240",
    padding: 18,
  },
  repoTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 10,
  },
  repoInfo: {
    flex: 1,
  },
  repoName: {
    color: "#eeedfe",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  repoUrl: {
    color: "#d4d2f8",
    fontSize: 12,
  },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
  },
  doneBadge: {
    backgroundColor: "#9fe1cb",
    borderWidth: 1,
    borderColor: "#085041",
  },
  emptyBadge: {
    backgroundColor: "#252240",
    borderWidth: 1,
    borderColor: "#3c3489",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  doneBadgeText: {
    color: "#085041",
  },
  emptyBadgeText: {
    color: "#d4d2f8",
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  tag: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#3c3489",
    backgroundColor: "#252240",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagText: {
    color: "#d4d2f8",
    fontSize: 11,
  },
  repoPreview: {
    color: "#afa9ec",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  repoBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  repoTime: {
    color: "#d4d2f8",
    fontSize: 12,
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  primaryButton: {
    borderRadius: 12,
    backgroundColor: "#1d9e75",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  primaryButtonText: {
    color: "#eeedfe",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3A336F",
    backgroundColor: "#252240",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  secondaryButtonText: {
    color: "#eeedfe",
    fontSize: 14,
    fontWeight: "500",
  },
  deleteButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.4)",
    backgroundColor: "rgba(239,68,68,0.1)",
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  deleteButtonText: {
    color: "#f8b4b4",
    fontSize: 14,
    fontWeight: "600",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(8,7,26,0.78)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    maxHeight: "90%",
    backgroundColor: "#171428",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#252240",
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 16,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    color: "#eeedfe",
    fontSize: 22,
    fontWeight: "600",
    marginBottom: 4,
  },
  modalMeta: {
    color: "#d4d2f8",
    fontSize: 12,
  },
  modalCloseButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#3A336F",
    backgroundColor: "#252240",
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  modalCloseButtonText: {
    color: "#eeedfe",
    fontSize: 14,
    fontWeight: "500",
  },
  editorLabel: {
    color: "#d4d2f8",
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 6,
  },
  editorInput: {
    minHeight: 180,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#3C3489",
    backgroundColor: "#0f0d1a",
    color: "#EEEDFE",
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  previewCard: {
    maxHeight: 180,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#252240",
    backgroundColor: "#100e1f",
    marginBottom: 18,
  },
  previewCardContent: {
    padding: 14,
  },
  previewText: {
    color: "#c8c2ef",
    fontSize: 14,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
});
