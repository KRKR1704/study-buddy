"use client"

import { useState } from "react"
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
import { ThemeProvider } from "./contexts/theme-context"
import { SidebarInset } from "@/components/ui/sidebar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QuizPage } from "./components/quiz-page"
import { QuizViewer } from "./components/quiz-viewer"
import { HistoryPage } from "./components/history-page"
import { PerformancePage } from "./components/performance-page"

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
  | "performance"

export default function Homepage() {
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Page navigation state
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState<CurrentPage>("dashboard")
  const [quizEntryPoint, setQuizEntryPoint] = useState<"summary" | "flashcards" | "quiz-section">("quiz-section")

  // Show authentication pages if not logged in
  if (!isAuthenticated) {
    return <AuthWrapper onAuthSuccess={() => setIsAuthenticated(true)} />
  }

  // Rest of the existing homepage code remains the same...
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
            onViewDocument={(docId) => {
              console.log("View document:", docId)
            }}
            onViewSummary={(docId) => {
              setCurrentPage("summarize")
            }}
            onViewFlashcards={(docId) => {
              setCurrentPage("flashcards")
            }}
            onRetakeQuiz={(docId) => {
              setQuizEntryPoint("quiz-section")
              setCurrentPage("quiz-viewer")
            }}
          />
        )
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium dark:text-white">Tasks Completed Today</CardTitle>
                      <span className="text-2xl">✅</span>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold dark:text-white">8</div>
                      <p className="text-xs text-muted-foreground">+2 from yesterday</p>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium dark:text-white">Study Streak</CardTitle>
                      <span className="text-2xl">🔥</span>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold dark:text-white">12 days</div>
                      <p className="text-xs text-muted-foreground">Keep it up!</p>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium dark:text-white">Weekly Performance</CardTitle>
                      <span className="text-2xl">📊</span>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold dark:text-white">85%</div>
                      <p className="text-xs text-muted-foreground">+5% from last week</p>
                    </CardContent>
                  </Card>

                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium dark:text-white">Upcoming Deadlines</CardTitle>
                      <span className="text-2xl">⏰</span>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600">3</div>
                      <p className="text-xs text-muted-foreground">This week</p>
                    </CardContent>
                  </Card>
                </div>
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
            onSummarizeClick={() => setCurrentPage("summarize")}
            onQuizClick={() => setCurrentPage("quiz")}
            onUploadsClick={() => setCurrentPage("uploads")}
            onPomodoroClick={() => setCurrentPage("pomodoro")}
            onHistoryClick={() => setCurrentPage("history")}
            onPerformanceClick={() => setCurrentPage("performance")}
            currentPage={currentPage}
            onNavigate={setCurrentPage}
          />
          <SidebarInset>
            <MainNav onUploadClick={() => setUploadModalOpen(true)} onLogout={() => setIsAuthenticated(false)} />
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
