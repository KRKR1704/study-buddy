"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent, CardFooter, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

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
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/+$/, "")

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
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-300 rounded w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="h-5 bg-gray-300 rounded w-3/4 mb-3" />
            <div className="h-20 bg-gray-300 rounded w-full" />
          </CardContent>
          <CardFooter className="px-4 py-3">
            <div className="flex gap-3 w-full">
              <div className="h-8 w-20 bg-gray-300 rounded" />
              <div className="h-8 w-20 bg-gray-300 rounded" />
            </div>
          </CardFooter>
        </Card>
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
    <div className="p-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => {
          const fileId = (it as any).source_file_id || (it as any).file_id || ((it as any).derived_file_ids && (it as any).derived_file_ids[0])
          const tok = typeof window !== "undefined" ? localStorage.getItem("token") : null
          const base = fileId ? `${API_BASE}/api/history/${encodeURIComponent(it._id)}/download/${encodeURIComponent(fileId)}` : null
          const href = base && tok ? `${base}?token=${encodeURIComponent(tok)}` : base
          const created = it.created_at ? new Date(it.created_at).toLocaleString() : ""
          const initials = `${(it.title || "").slice(0,1)}`.toUpperCase()
          const excerpt = (() => {
            try {
              if (it.type === "summary" && (it as any).summary) {
                const s = String((it as any).summary || "").trim()
                return s.length > 250 ? s.slice(0,250) + "..." : s
              }
              const c = (it as any).content
              if (!c && c !== 0) return ""
              if (typeof c === "string") {
                const s = c.trim()
                return s.length > 250 ? s.slice(0,250) + "..." : s
              }
              const s = JSON.stringify(c)
              const cleaned = s === '""' ? "" : s
              return cleaned.length > 250 ? cleaned.slice(0,250) + "..." : cleaned
            } catch {
              return ""
            }
          })()
          const hasFlashcards = it.type === "flashcards" || Boolean((it as any).flashcards || (it as any).cards || ((it.content || {}).flashcards) || ((it.content || {}).cards))
          const hasQuiz = it.type === "quiz" || Boolean((it as any).quiz || (it as any).questions || ((it.content || {}).quiz) || ((it.content || {}).questions))

          return (
            <Card key={it._id}>
              <CardHeader className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm opacity-70">{it.type?.toUpperCase()}</div>
                  <div className="text-lg font-semibold">{it.title}</div>
                  <div className="text-xs text-muted-foreground mt-1">{created}</div>
                  {it.source_name && <div className="text-xs opacity-70">{it.source_name}</div>}
                </div>
              </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-4">{excerpt}</p>
                {it.tags && it.tags.length > 0 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {it.tags.map((t) => (
                      <span key={t} className="text-xs bg-accent/10 text-muted-foreground px-2 py-1 rounded">{t}</span>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-end gap-3 px-4 py-3 flex-wrap">
                <div className="flex gap-3">
                  {href && (
                    <Button size="sm" onClick={() => window.open(href, "_blank")}>Open</Button>
                  )}
                  {!href && (it as any).summary && (
                    <Button size="sm" onClick={() => onViewSummary?.(it._id)}>Open</Button>
                  )}

                  {(it as any).summary && (
                    <Button variant="ghost" size="sm" onClick={() => onViewSummary?.(it._id)}>Summary</Button>
                  )}

                  {hasFlashcards && (
                    <Button variant="ghost" size="sm" onClick={() => onViewFlashcards?.(it._id)}>Flashcards</Button>
                  )}

                  {hasQuiz && (
                    <Button variant="ghost" size="sm" onClick={() => onRetakeQuiz?.(it._id)}>Retake Quiz</Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
