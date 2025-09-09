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

// If your FastAPI is behind a different origin, set NEXT_PUBLIC_API_BASE accordingly
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") || "";

export async function addHistory(item: Omit<HistoryItem, "_id" | "created_at" | "updated_at">) {
  const res = await fetch(`${API_BASE}/api/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`addHistory failed: ${res.status} ${msg}`);
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
  const res = await fetch(`${API_BASE}/api/history?${qs.toString()}`);
  if (!res.ok) {
    const msg = await res.text();
    throw new Error(`listHistory failed: ${res.status} ${msg}`);
  }
  return (await res.json()) as { items: HistoryItem[]; next_cursor?: string | null };
}

export function historyDownloadUrl(itemId: string) {
  return `${API_BASE}/api/history/${itemId}/download`;
}
