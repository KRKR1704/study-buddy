"use client";
import { useEffect, useState } from "react";

type HistoryItem = {
  _id: string;            // coming as id/_id → we’ll normalize
  id?: string;
  type: "summary" | "flashcards" | "quiz";
  title: string;
  source_name?: string;
  source_type?: string;
  content: any;
  tags: string[];
  downloadable_url?: string;
  created_at: string;
};

interface HistoryPageProps {
  onBackToDashboard?: () => void
  onViewDocument?: (id: string) => void
  onViewSummary?: (id: string) => void
  onViewFlashcards?: (id: string) => void
  onRetakeQuiz?: (id: string) => void
}

export default function HistoryPage({
  onBackToDashboard,
  onViewDocument,
  onViewSummary,
  onViewFlashcards,
  onRetakeQuiz,
}: HistoryPageProps) {
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Prefer env; fallback to localhost
  const API_BASE = (process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8000").replace(/\/+$/, "")

  // derive current user id from localStorage (or fallback)
  const getCurrentUserId = () => {
    if (typeof window === "undefined") return "dev-user"
    return localStorage.getItem("sb_user_id") || localStorage.getItem("sb_user") && (() => {
      try { return JSON.parse(localStorage.getItem("sb_user") || "{}").id || JSON.parse(localStorage.getItem("sb_user") || "{}")._id } catch { return null }
    })() || "dev-user"
  }

  useEffect(() => {
    const load = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const userId = getCurrentUserId()
        const headers: Record<string, string> = {}
        if (token) headers["Authorization"] = `Bearer ${token}`
        const res = await fetch(`${API_BASE}/api/history${userId ? `?user_id=${encodeURIComponent(userId)}` : ""}`, {
          headers,
        });
        const ct = res.headers.get("content-type") || ""
        if (!ct.includes("application/json")) {
          const txt = await res.text().catch(() => "")
          throw new Error(`Non-JSON response: ${res.status} ${txt}`)
        }
        const data = await res.json();
        // backend returns an array of history items
        const arr = Array.isArray(data) ? data : data.items || []
        setItems(arr.map((d: any) => ({ ...d, _id: d._id || d.id }))) // normalize id
      } catch (e) {
        console.error("History load error:", e)
        setError((e as Error)?.message || String(e))
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);
  if (loading) return (
    <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1,2,3,4,5,6].map((i) => (
        <div key={i} className="rounded-2xl shadow p-4 bg-white/5 border border-white/10 animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-1/4 mb-2" />
          <div className="h-5 bg-gray-300 rounded w-3/4 mb-3" />
          <div className="h-20 bg-gray-300 rounded w-full" />
          <div className="mt-3 flex gap-2">
            <div className="h-8 w-20 bg-gray-300 rounded" />
            <div className="h-8 w-20 bg-gray-300 rounded" />
          </div>
        </div>
      ))}
    </div>
  )

  if (error) return (
    <div className="p-6 text-red-500">
      Error loading history: {error}
      <div className="mt-2">Try refreshing or check the backend is running.</div>
    </div>
  )

  if (items.length === 0) return (
    <div className="p-6">
      <div className="text-lg font-medium">No history found</div>
      <p className="text-sm text-muted-foreground">Upload or summarize a document to see history items here.</p>
      <div className="mt-4">
        <button onClick={onBackToDashboard} className="px-3 py-2 rounded bg-blue-600 text-white">Back to dashboard</button>
      </div>
    </div>
  )

  return (
    <div className="p-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((it) => (
        <div key={it._id} className="rounded-2xl shadow p-4 bg-white/5 border border-white/10">
          <div className="text-sm opacity-70">{it.type?.toUpperCase()}</div>
          <div className="text-lg font-semibold">{it.title}</div>
          {it.source_name && <div className="text-xs opacity-70">{it.source_name}</div>}

          {/* simple preview */}
          <pre className="mt-2 max-h-40 overflow-auto text-xs bg-black/20 p-2 rounded">
            {JSON.stringify(it.content, null, 2)}
          </pre>

          <div className="mt-3 flex gap-2">
            {(() => {
              const fileId = (it as any).source_file_id || (it as any).file_id || ((it as any).derived_file_ids && (it as any).derived_file_ids[0])
              if (fileId) {
                // include token as query param so anchor downloads can work without headers
                const tok = typeof window !== "undefined" ? localStorage.getItem("token") : null
                const base = `${API_BASE}/api/history/${encodeURIComponent(it._id)}/download/${encodeURIComponent(fileId)}`
                const href = tok ? `${base}?token=${encodeURIComponent(tok)}` : base
                return (
                  <a
                    href={href}
                    className="px-3 py-1 rounded-xl border hover:bg-white/10"
                  >
                    Download
                  </a>
                )
              }
              return null
            })()}
            <button
              onClick={() => onViewDocument?.(it._id)}
              className="px-3 py-1 rounded-xl border hover:bg-white/10"
            >
              Open
            </button>
            <button
              onClick={() => onViewSummary?.(it._id)}
              className="px-3 py-1 rounded-xl border hover:bg-white/10"
            >
              Summary
            </button>
            <button
              onClick={() => onViewFlashcards?.(it._id)}
              className="px-3 py-1 rounded-xl border hover:bg-white/10"
            >
              Flashcards
            </button>
            <button
              onClick={() => onRetakeQuiz?.(it._id)}
              className="px-3 py-1 rounded-xl border hover:bg-white/10"
            >
              Retake Quiz
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
