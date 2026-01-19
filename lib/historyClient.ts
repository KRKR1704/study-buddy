// src/lib/historyClient.ts
export type Flashcard = { front: string; back: string };
export type QuizQuestion = {
  question: string;
  options?: string[];
  answer?: string;          // correct answer if known
  explanation?: string;
};
export type QuizPayload = {
  title?: string;
  questions: QuizQuestion[];
  score?: number;           // percent or raw
  meta?: Record<string, any>;
};

export type HistoryItem = {
  _id: string;
  user_id: string;
  source: "summarizer" | "quiz";
  file_name?: string;
  file_id?: string;         // GridFS/S3 key
  content_text?: string;
  summary?: string;
  key_takeaways?: string[];
  flashcards?: Flashcard[];
  quiz?: QuizPayload;
  tags?: string[];
  meta?: Record<string, any>;
  created_at: string;       // ISO string
  updated_at: string;       // ISO string
};

// If your FastAPI is behind a different origin, set NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_BASE
const API_BASE =
  (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "");

function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token") || null;
}

function authHeaders(): HeadersInit {
  const t = getStoredToken();
  const h: Record<string, string> = {};
  if (t) h["Authorization"] = `Bearer ${t}`;
  return h;
}

export async function addHistory(item: Omit<HistoryItem, "_id" | "created_at" | "updated_at">) {
  const res = await fetch(`${API_BASE}/api/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`addHistory failed: ${res.status} ${msg}`);
  }
  const ct = res.headers.get("content-type") || ""
  if (!ct.includes("application/json")) {
    const txt = await res.text().catch(() => "")
    throw new Error(`addHistory expected JSON but got: ${txt}`)
  }
  return (await res.json()) as HistoryItem;
}

export async function listHistory(params: {
  user_id: string;
  source?: "summarizer" | "quiz";
  limit?: number;
  cursor?: string;
}) {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null)
      .map(([k, v]) => [k, String(v)])
  );
  const res = await fetch(`${API_BASE}/api/history?${qs.toString()}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`listHistory failed: ${res.status} ${msg}`);
  }
  const ct = res.headers.get("content-type") || ""
  if (!ct.includes("application/json")) {
    const txt = await res.text().catch(() => "")
    throw new Error(`listHistory expected JSON but got: ${txt}`)
  }
  return (await res.json()) as { items: HistoryItem[]; next_cursor?: string | null };
}

export function historyDownloadUrl(itemId: string, fileId: string) {
  const token = getStoredToken();
  const base = `${API_BASE}/api/history/${encodeURIComponent(itemId)}/download/${encodeURIComponent(fileId)}`;
  return base;
}

export async function getHistory(itemId: string, user_id?: string) {
  // server prefers Authorization header; we include token if present. For backward compatibility
  // a client may pass `user_id` but it's no longer required.
  const url = `${API_BASE}/api/history/${encodeURIComponent(itemId)}` + (user_id ? `?user_id=${encodeURIComponent(user_id)}` : "");
  const res = await fetch(url, { headers: { ...authHeaders() } })
  if (!res.ok) {
    const msg = await res.text().catch(() => '')
    throw new Error(`getHistory failed: ${res.status} ${msg}`)
  }
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    const txt = await res.text().catch(() => '')
    throw new Error(`getHistory expected JSON but got: ${txt}`)
  }
  return (await res.json()) as HistoryItem
}
