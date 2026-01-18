"use client"

import { useState, useEffect } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"
import { AuthWrapper } from "./components/auth-wrapper"
import { AppSidebar } from "./components/app-sidebar"
import { MainNav } from "./components/main-nav"
import { FileUploadModal } from "./components/file-upload-modal"
import { AddTaskModal } from "./components/add-task-modal"
import { CalendarPage } from "./components/calendar-page"
import { SummarizerPage } from "./components/summarizer-page"
import { FlashcardViewer } from "./components/flashcard-viewer"
import { UploadsPage } from "./components/uploads-page"
import { PomodoroPage } from "./components/pomodoro-page"
import { TaskProvider } from "./contexts/task-context"
import { useTasks } from "./contexts/task-context"
import { getHistory, historyDownloadUrl, listHistory } from "./lib/historyClient"
import { setItem, clearAllForUser, currentUserId } from "@/lib/userLocalStorage"
import { ThemeProvider } from "./contexts/theme-context"
import { SidebarInset } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuizPage } from "./components/quiz-page"
import { QuizViewer } from "./components/quiz-viewer"
import HistoryPage from "./components/history-page"
import { PerformancePage } from "./components/performance-page"
import { AccountSettings } from "./components/account-settings"

type CurrentPage =
  | "dashboard"
  | "calendar"
  | "summarize"
  | "flashcards"
  | "quiz"
  | "quiz-viewer"
  | "uploads"
  | "pomodoro"
  | "history"
  | "account"
  | "performance"

export default function Homepage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
  // avoid flicker: don't render auth UI until we've checked localStorage on the client
  const [authChecked, setAuthChecked] = useState<boolean>(false)

  // read auth token on mount (client only)
  useEffect(() => {
    try {
      const t = typeof window !== "undefined" ? localStorage.getItem("token") : null
      setIsAuthenticated(!!t)
    } catch {
      setIsAuthenticated(false)
    } finally {
      setAuthChecked(true)
    }
  }, [])

  // Page navigation state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<CurrentPage>(() => {
    try {
      if (typeof window !== "undefined") {
        const p = localStorage.getItem("sb_current_page")
        if (p) return p as CurrentPage
      }
    } catch {}
    return "dashboard"
  })
  const [quizEntryPoint, setQuizEntryPoint] = useState<"summary" | "flashcards" | "quiz-section">("quiz-section")
  const [summarizerAutoLoad, setSummarizerAutoLoad] = useState<boolean>(false)

  // persist current page so reloads stay on the same page
  useEffect(() => {
    try {
      if (typeof window !== "undefined") localStorage.setItem("sb_current_page", currentPage)
    } catch {}
  }, [currentPage])

  // Wait until we've checked auth to avoid flicker between login/dashboard
  if (!authChecked) return null

  // Show authentication pages if not logged in
  if (!isAuthenticated) {
    return <AuthWrapper onAuthSuccess={() => setIsAuthenticated(true)} />
  }

  // Rest of the existing homepage code remains the same...
  function DashboardTiles() {
    const taskCtx = useTasks ? useTasks() : { tasks: [] }

    const [tasksCompletedToday, setTasksCompletedToday] = useState<number>(0)
    const [studyStreak, setStudyStreak] = useState<string>("0 days")
    const [weeklyPerf, setWeeklyPerf] = useState<string>("0%")
    const [upcomingDeadlines, setUpcomingDeadlines] = useState<number>(0)

    useEffect(() => {
      try {
        const today = new Date().toISOString().slice(0, 10)
        const completedToday = (taskCtx.tasks || []).filter((t: any) => t.date === today && t.completed).length
        setTasksCompletedToday(completedToday)

        // upcoming deadlines in next 7 days (not completed)
        const now = new Date()
        const upcoming = (taskCtx.tasks || []).filter((t: any) => {
          if (t.completed) return false
          try {
            const d = new Date(t.date)
            const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
            return diff >= 0 && diff <= 7
          } catch {
            return false
          }
        }).length
        setUpcomingDeadlines(upcoming)
      } catch (e) {
        console.error(e)
      }
    }, [taskCtx.tasks])

    useEffect(() => {
      ;(async () => {
        try {
          const uid = currentUserId()
          if (!uid) return
          const res = await listHistory({ user_id: uid, limit: 200 })
          const items = res?.items || []
          const daysWithActivity = new Set(items.map((it: any) => (it.created_at || "").slice(0, 10)))

          // compute streak (consecutive days ending today)
          let streak = 0
          const today = new Date()
          for (let i = 0; i < 365; i++) {
            const d = new Date()
            d.setDate(today.getDate() - i)
            const key = d.toISOString().slice(0, 10)
            if (daysWithActivity.has(key)) streak++
            else break
          }
          setStudyStreak(`${streak} day${streak === 1 ? "" : "s"}`)

          // weekly performance = percent of last 7 days with activity
          const last7 = new Set<string>()
          for (let i = 0; i < 7; i++) {
            const d = new Date()
            d.setDate(today.getDate() - i)
            last7.add(d.toISOString().slice(0, 10))
          }
          let active = 0
          for (const d of Array.from(last7)) if (daysWithActivity.has(d)) active++
          const perf = Math.round((active / 7) * 100)
          setWeeklyPerf(`${perf}%`)
        } catch (e) {
          console.error(e)
        }
      })()
    }, [])

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-white">Tasks Completed Today</CardTitle>
            <span className="text-2xl">✅</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{tasksCompletedToday}</div>
            <p className="text-xs text-muted-foreground">{tasksCompletedToday >= 0 ? "+" + Math.max(0, tasksCompletedToday - 0) + " from yesterday" : ""}</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-white">Study Streak</CardTitle>
            <span className="text-2xl">🔥</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{studyStreak}</div>
            <p className="text-xs text-muted-foreground">Keep it up!</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-white">Weekly Performance</CardTitle>
            <span className="text-2xl">📊</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold dark:text-white">{weeklyPerf}</div>
            <p className="text-xs text-muted-foreground">+{0}% from last week</p>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium dark:text-white">Upcoming Deadlines</CardTitle>
            <span className="text-2xl">⏰</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{upcomingDeadlines}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
      </div>
    )
  }
  const renderCurrentPage = () => {
    switch (currentPage) {
      case "calendar":
        return <CalendarPage onAddTaskClick={() => setAddTaskModalOpen(true)} />
      case "summarize":
        return (
          <SummarizerPage
            onBackToDashboard={() => setCurrentPage("dashboard")}
            onViewFlashcards={() => setCurrentPage("flashcards")}
            onViewQuiz={() => {
              setQuizEntryPoint("summary")
              setCurrentPage("quiz-viewer")
            }}
            autoLoad={summarizerAutoLoad}
          />
        )
      case "flashcards":
        return (
          <FlashcardViewer
            onBack={() => setCurrentPage("summarize")}
            onViewQuiz={() => {
              setQuizEntryPoint("flashcards")
              setCurrentPage("quiz-viewer")
            }}
            onBackToDashboard={() => setCurrentPage("dashboard")}
          />
        )
      case "quiz":
        return (
          <QuizPage
            onBackToDashboard={() => setCurrentPage("dashboard")}
            onStartQuiz={(entryPoint) => {
              setQuizEntryPoint(entryPoint)
              setCurrentPage("quiz-viewer")
            }}
          />
        )
      case "quiz-viewer":
        return (
          <QuizViewer
            entryPoint={quizEntryPoint}
            onComplete={() => {
              if (quizEntryPoint === "quiz-section") {
                setCurrentPage("dashboard")
              } else {
                setCurrentPage("summarize")
              }
            }}
          />
        )
      case "uploads":
        return (
          <UploadsPage
            onBackToDashboard={() => setCurrentPage("dashboard")}
            onUploadClick={() => setUploadModalOpen(true)}
            onViewSummary={(fileId) => {
              setCurrentPage("summarize")
            }}
            onViewQuiz={(fileId) => {
              setQuizEntryPoint("quiz-section")
              setCurrentPage("quiz-viewer")
            }}
            onViewFlashcards={(fileId) => {
              setCurrentPage("flashcards")
            }}
          />
        )
      case "pomodoro":
        return <PomodoroPage onBackToDashboard={() => setCurrentPage("dashboard")} isAdmin={true} />
      case "history":
        return (
          <HistoryPage
            onBackToDashboard={() => setCurrentPage("dashboard")}
            onViewDocument={async (docId) => {
              try {
                // fetch the history item to determine the attached file id
                const item = await getHistory(docId)
                const fileId = (item as any).source_file_id || (item as any).file_id || ((item as any).derived_file_ids && (item as any).derived_file_ids[0])
                if (fileId) {
                  const url = historyDownloadUrl(docId, fileId)
                  window.open(url, "_blank")
                } else {
                  // If there's no downloadable file, fall back to opening the summary view
                  if ((item as any).summary) {
                    setItem('sb_summary', (item as any).summary)
                    if (Array.isArray((item as any).key_takeaways)) setItem('sb_keypoints', JSON.stringify((item as any).key_takeaways))
                    if (Array.isArray((item as any).flashcards)) setItem('sb_flashcards', JSON.stringify((item as any).flashcards))
                    if (Array.isArray((item as any).quiz)) {
                      setItem('sb_quiz', JSON.stringify((item as any).quiz))
                    } else if ((item as any).quiz && Array.isArray((item as any).quiz.questions)) {
                      setItem('sb_quiz', JSON.stringify((item as any).quiz.questions))
                    }
                    setSummarizerAutoLoad(true)
                    setCurrentPage('summarize')
                  } else {
                    alert('No downloadable file attached to this history item')
                  }
                }
              } catch (e) {
                console.error(e)
              }
            }}
            onViewSummary={async (docId) => {
              try {
                const item = await getHistory(docId)
                // write data into per-user localStorage expected by SummarizerPage
                try {
                  if ((item as any).summary) setItem('sb_summary', (item as any).summary)
                  if ((item as any).title) setItem('sb_title', (item as any).title)
                  if (Array.isArray((item as any).key_takeaways)) setItem('sb_keypoints', JSON.stringify((item as any).key_takeaways))
                  if (Array.isArray((item as any).flashcards)) setItem('sb_flashcards', JSON.stringify((item as any).flashcards))
                  // history item may store quiz as an array or as an object { questions: [] }
                  if (Array.isArray((item as any).quiz)) {
                    setItem('sb_quiz', JSON.stringify((item as any).quiz))
                  } else if ((item as any).quiz && Array.isArray((item as any).quiz.questions)) {
                    setItem('sb_quiz', JSON.stringify((item as any).quiz.questions))
                  }
                } catch {
                  if ((item as any).summary) localStorage.setItem('sb_summary', (item as any).summary)
                  if ((item as any).title) localStorage.setItem('sb_title', (item as any).title)
                  if (Array.isArray((item as any).key_takeaways)) localStorage.setItem('sb_keypoints', JSON.stringify((item as any).key_takeaways))
                  if (Array.isArray((item as any).flashcards)) localStorage.setItem('sb_flashcards', JSON.stringify((item as any).flashcards))
                  if (Array.isArray((item as any).quiz)) {
                    localStorage.setItem('sb_quiz', JSON.stringify((item as any).quiz))
                  } else if ((item as any).quiz && Array.isArray((item as any).quiz.questions)) {
                    localStorage.setItem('sb_quiz', JSON.stringify((item as any).quiz.questions))
                  }
                }
                setSummarizerAutoLoad(true)
                setCurrentPage('summarize')
              } catch (e) {
                console.error(e)
                alert('Unable to load summary for that item')
              }
            }}
            onViewFlashcards={async (docId) => {
              try {
                const item = await getHistory(docId)
                try {
                  if (Array.isArray((item as any).flashcards)) setItem('sb_flashcards', JSON.stringify((item as any).flashcards))
                } catch {
                  if (Array.isArray((item as any).flashcards)) localStorage.setItem('sb_flashcards', JSON.stringify((item as any).flashcards))
                }
                setCurrentPage('flashcards')
              } catch (e) {
                console.error(e)
                alert('Unable to load flashcards for that item')
              }
            }}
            onRetakeQuiz={(docId) => {
              // similar flow to summary — load quiz and then navigate
              (async () => {
                try {
                  const item = await getHistory(docId)
                  // normalize stored quiz into an array of questions for the QuizViewer
                  try {
                    if (Array.isArray((item as any).quiz)) {
                      setItem('sb_quiz', JSON.stringify((item as any).quiz))
                    } else if ((item as any).quiz && Array.isArray((item as any).quiz.questions)) {
                      setItem('sb_quiz', JSON.stringify((item as any).quiz.questions))
                    }
                  } catch {
                    if (Array.isArray((item as any).quiz)) {
                      localStorage.setItem('sb_quiz', JSON.stringify((item as any).quiz))
                    } else if ((item as any).quiz && Array.isArray((item as any).quiz.questions)) {
                      localStorage.setItem('sb_quiz', JSON.stringify((item as any).quiz.questions))
                    }
                  }
                  setQuizEntryPoint('quiz-section')
                  setCurrentPage('quiz-viewer')
                } catch (e) {
                  console.error(e)
                  alert('Unable to load quiz for that item')
                }
              })()
            }}
          />
        )
      case "account":
        return <AccountSettings />
      case "performance":
        return <PerformancePage onBackToDashboard={() => setCurrentPage("dashboard")} />
      case "dashboard":
      default:
        return (
          <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome to Study Buddy</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  Your AI-powered study companion for summarizing, quizzing, and organizing your learning materials.
                </p>
              </div>

              {/* Performance Dashboard */}
              <div className="space-y-6">
                {/* Overview Cards */}
                <DashboardTiles />
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <ThemeProvider>
      <TaskProvider>
        <SidebarProvider>
          <AppSidebar
            onAddTaskClick={() => setAddTaskModalOpen(true)}
            onCalendarClick={() => setCurrentPage("calendar")}
            onSummarizeClick={() => { setSummarizerAutoLoad(false); setCurrentPage("summarize") }}
            onQuizClick={() => setCurrentPage("quiz")}
            onUploadsClick={() => setCurrentPage("uploads")}
            onPomodoroClick={() => setCurrentPage("pomodoro")}
            onHistoryClick={() => setCurrentPage("history")}
            onPerformanceClick={() => setCurrentPage("performance")}
            currentPage={currentPage}
            onNavigate={setCurrentPage}
          />
          <SidebarInset>
            <MainNav onUploadClick={() => setUploadModalOpen(true)} onLogout={() => {
              // Clear auth state and per-user localStorage keys on logout and return to dashboard
              try {
                const uid = localStorage.getItem('sb_user_id')
                if (uid) {
                  clearAllForUser(uid)
                }
              } catch {}
              localStorage.removeItem('token')
              localStorage.removeItem('sb_user_id')
              localStorage.removeItem('sb_user')
              setIsAuthenticated(false)
              setCurrentPage('dashboard')
            }} />
            {renderCurrentPage()}
            <FileUploadModal open={uploadModalOpen} onOpenChange={setUploadModalOpen} />
            <AddTaskModal open={addTaskModalOpen} onOpenChange={setAddTaskModalOpen} />
          </SidebarInset>
          <Toaster />
        </SidebarProvider>
      </TaskProvider>
    </ThemeProvider>
  )
}
