export type StoredRepoRecord = {
  id: string;
  name: string;
  fullName: string;
  remoteUrl: string;
  readme: string;
  languages: string[];
  visibility: "private" | "public";
  updatedAt: string;
  createdAt: string;
  generationNumber: number;
  failureReason: string;
};

export type DashboardStats = {
  totalReadmes: number;
  totalRepos: number;
  thisWeekCount: number;
};

export function normalizeStoredRepo(raw: any, index: number): StoredRepoRecord {
  const metadata = raw?.Metadata ?? raw?.metadata ?? {};
  const languages = Array.isArray(metadata?.languages)
    ? metadata.languages.filter((language: unknown) => typeof language === "string")
    : typeof metadata?.language === "string" && metadata.language.trim()
    ? [metadata.language.trim()]
    : [];

  return {
    id: String(raw?._id ?? raw?.id ?? `repo-${index}`),
    name: String(raw?.Name ?? raw?.name ?? raw?.title ?? `Repo ${index + 1}`),
    fullName: String(
      raw?.FullName ?? raw?.fullName ?? raw?.Name ?? raw?.name ?? ""
    ),
    remoteUrl: String(raw?.RemoteUrl ?? raw?.remoteUrl ?? raw?.url ?? ""),
    readme: String(raw?.Readme ?? raw?.readme ?? raw?.content ?? ""),
    languages,
    visibility: raw?.IsPrivate ? "private" : "public",
    updatedAt: String(raw?.UpdatedAt ?? raw?.updatedAt ?? raw?.CreatedAt ?? ""),
    createdAt: String(raw?.CreatedAt ?? raw?.createdAt ?? raw?.UpdatedAt ?? ""),
    generationNumber: Math.max(0, Number(raw?.GenerationNumber ?? 0)),
    failureReason: String(
      metadata?.readmeFailureReason ?? raw?.error ?? raw?.message ?? ""
    ),
  };
}

export function buildPreview(content: string) {
  const preview = content.replace(/\s+/g, " ").trim();

  if (!preview) {
    return "Generated README content will appear here when it is available.";
  }

  return preview.length > 140 ? `${preview.slice(0, 140)}...` : preview;
}

export function timeAgo(dateValue: string) {
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

export function formatReadmeDate(dateValue: string) {
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

export function formatStatDate(dateValue: string) {
  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function getRepoTimestamp(repo: StoredRepoRecord) {
  const updatedAt = new Date(repo.updatedAt).getTime();

  if (!Number.isNaN(updatedAt)) {
    return updatedAt;
  }

  const createdAt = new Date(repo.createdAt).getTime();
  return Number.isNaN(createdAt) ? 0 : createdAt;
}
