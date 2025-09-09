"use client"

import type React from "react"
import { useState } from "react"
import { Upload, FileText, ArrowRight, CheckCircle, Loader2, Brain, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface QuizPageProps {
  onBackToDashboard: () => void
  onStartQuiz: (entryPoint: "quiz-section") => void
}

type QuizStep = "upload" | "processing" | "ready"
type ProcessingStep = 1 | 2 | 3

type Flashcard = { front: string; back: string }
type QuizItem =
  | { question: string; options: string[]; answerIndex: number; explanation?: string; category?: string }
  | any // be flexible with shapes from backend

// Prefer env; fallback to local dev
const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8000").replace(/\/+$/, "")
const API_URL = `${API_BASE}/api/summarize/`
const HISTORY_URL = `${API_BASE}/api/history`

// ---- Replace with your real auth. For now, read a fallback from localStorage. ----
function getCurrentUserId(): string {
  const fromLS = (typeof window !== "undefined" && localStorage.getItem("sb_user_id")) || ""
  return fromLS || "dev-user"
}

// Save Quiz to History (non-blocking)
async function saveQuizToHistory(payload: {
  user_id: string
  file_name?: string
  file_id?: string
  flashcards?: Flashcard[]
  quiz: {
    title?: string
    questions: { question: string; options?: string[]; answer?: string; explanation?: string }[]
    score?: number
    meta?: Record<string, any>
  }
}) {
  try {
    const res = await fetch(HISTORY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: payload.user_id,
        source: "quiz",
        file_name: payload.file_name,
        file_id: payload.file_id, // GridFS/S3 key if your summarize API returns it
        flashcards: payload.flashcards || [],
        quiz: payload.quiz,
        tags: ["quiz"],
        meta: { page: "quiz" },
      }),
    })
    if (!res.ok) {
      console.warn("saveQuizToHistory failed:", res.status, await res.text().catch(() => ""))
    }
  } catch (e) {
    console.warn("saveQuizToHistory error:", e)
  }
}

export function QuizPage({ onBackToDashboard, onStartQuiz }: QuizPageProps) {
  const [currentStep, setCurrentStep] = useState<QuizStep>("upload")
  const [processingStep, setProcessingStep] = useState<ProcessingStep>(1)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // simple metadata
  const [title, setTitle] = useState<string>("Quiz")

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true)
    else if (e.type === "dragleave") setDragActive(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files)
      setUploadedFiles(newFiles)
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setUploadedFiles(newFiles)
    }
  }

  const getStepStatus = (step: ProcessingStep) => {
    if (processingStep > step) return "completed"
    if (processingStep === step) return "active"
    return "pending"
  }

  const getStepText = (step: ProcessingStep) => {
    switch (step) {
      case 1:
        return "Analyzing document content"
      case 2:
        return "Generating quiz questions"
      case 3:
        return "Preparing interactive quiz"
      default:
        return ""
    }
  }

  async function startProcessing() {
    if (uploadedFiles.length === 0 || isSubmitting) return

    // Clear previous quiz/flashcards so we never show stale data
    localStorage.removeItem("sb_quiz")
    localStorage.removeItem("sb_flashcards")

    // File type guard (match your backend support)
    const allowed = [
      ".pdf", ".docx", ".pptx", ".txt", ".rtf", ".md", ".markdown", ".html", ".htm", ".csv", ".xlsx", ".epub"
    ]
    const file = uploadedFiles[0]
    const name = file.name
    const ext = `.${(name.split(".").pop() || "").toLowerCase()}`
    if (!allowed.includes(ext)) {
      alert("Unsupported file type. Please upload a text document (PDF/DOCX/PPTX/TXT/RTF/MD/HTML/CSV/XLSX/EPUB).")
      return
    }

    setIsSubmitting(true)
    setCurrentStep("processing")
    setProcessingStep(1)

    // staged UX progress while the network call happens
    const timers: number[] = []
    timers.push(window.setTimeout(() => setProcessingStep(2), 1000))
    timers.push(window.setTimeout(() => setProcessingStep(3), 2000))

    try {
      setTitle(file.name.replace(/\.[^.]+$/, "") || "Quiz")

      const form = new FormData()
      form.append("file", file)

      const res = await fetch(API_URL, { method: "POST", body: form })
      if (!res.ok) {
        const errText = await res.text().catch(() => "")
        throw new Error(errText || `Request failed with status ${res.status}`)
      }

      const json = await res.json()
      if (!json?.success) {
        throw new Error(json?.error || "Quiz generation failed on the server.")
      }

      // expected: { success: true, data: { summary?, flashcards?, quiz, file_id? } }
      const data = json.data || {}
      const cards = Array.isArray(data.flashcards) ? (data.flashcards as Flashcard[]) : []
      const quiz = Array.isArray(data.quiz) ? (data.quiz as QuizItem[]) : []
      const fileIdFromServer: string | undefined = data.file_id

      // Save fresh results for your QuizViewer
      localStorage.setItem("sb_flashcards", JSON.stringify(cards))
      localStorage.setItem("sb_quiz", JSON.stringify(quiz))

      // -------------------- NEW: Save to History (non-blocking) --------------------
      const userId = getCurrentUserId()

      // Map QuizItem[] (answerIndex) into History-friendly question objects (answer string optional)
      const mappedQuizQuestions = quiz.map((q: any) => {
        const options: string[] | undefined = Array.isArray(q.options) ? q.options : undefined
        let answer: string | undefined
        if (typeof q.answerIndex === "number" && options && options[q.answerIndex] != null) {
          answer = options[q.answerIndex]
        } else if (typeof q.answer === "string") {
          // If backend already provides answer as string, keep it
          answer = q.answer
        }
        return {
          question: q.question ?? "",
          options,
          answer,
          explanation: q.explanation,
        }
      })

      void saveQuizToHistory({
        user_id: userId,
        file_name: file.name,
        file_id: fileIdFromServer, // only works if summarize endpoint stored it; otherwise omit
        flashcards: cards,         // optional: store alongside quiz
        quiz: {
          title: `${file.name.replace(/\.[^.]+$/, "")} — Quiz`,
          questions: mappedQuizQuestions,
          meta: { generatedFrom: "quiz-page" },
        },
      })
      // ---------------------------------------------------------------------------

      // small delay so users see step 3
      await new Promise((r) => setTimeout(r, 500))
      setCurrentStep("ready")
    } catch (err: any) {
      console.error(err)
      alert(err?.message || "Something went wrong while generating the quiz. Please try again.")
      setCurrentStep("upload")
    } finally {
      setIsSubmitting(false)
      timers.forEach((t) => window.clearTimeout(t))
    }
  }

  const renderUploadStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Brain className="h-8 w-8" />
          Interactive Quiz Generator
        </h2>
        <p className="text-gray-600">Upload your document to generate an AI-powered quiz from that exact file.</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Document for Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">Drop file here or click to browse</p>
            <p className="text-sm text-gray-500 mb-4">
              Supports PDF, DOCX, PPTX, TXT, RTF, MD/Markdown, HTML/HTM, CSV, XLSX, EPUB
            </p>
            <input
              type="file"
              onChange={handleFileInput}
              className="hidden"
              id="quiz-file-input"
              accept=".pdf,.docx,.pptx,.txt,.rtf,.md,.markdown,.html,.htm,.csv,.xlsx,.epub"
            />
            <Button asChild>
              <label htmlFor="quiz-file-input" className="cursor-pointer">
                Choose File
              </label>
            </Button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Selected File:</h4>
              <div className="space-y-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedFiles((files) => files.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBackToDashboard}>
          Back to Dashboard
        </Button>
        <Button
          onClick={startProcessing}
          disabled={uploadedFiles.length === 0 || isSubmitting}
          className="bg-green-600 hover:bg-green-700"
        >
          {isSubmitting ? "Generating..." : "Generate Quiz"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderProcessingStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Generating Your Quiz</h2>
        <p className="text-gray-600">Please wait while we create interactive questions from your content</p>
      </div>

      <Card className="p-8">
        <div className="space-y-8">
          {/* Progress Steps */}
          <div className="flex items-center justify-center space-x-8">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                    getStepStatus(step as ProcessingStep) === "completed"
                      ? "bg-green-500 border-green-500 text-white"
                      : getStepStatus(step as ProcessingStep) === "active"
                        ? "bg-blue-500 border-blue-500 text-white"
                        : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {getStepStatus(step as ProcessingStep) === "completed" ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : getStepStatus(step as ProcessingStep) === "active" ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <span className="font-bold">{step}</span>
                  )}
                </div>
                <p className="text-sm font-medium mt-2 text-gray-700">{getStepText(step as ProcessingStep)}</p>
                {getStepStatus(step as ProcessingStep) === "active" && (
                  <div className="mt-2">
                    <Progress value={66} className="w-24 h-2" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Current Step Description */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Step {processingStep}: {getStepText(processingStep)}
            </h3>
            <p className="text-gray-600">
              {processingStep === 1 && "Reading and understanding your document content..."}
              {processingStep === 2 && "Creating challenging questions based on key concepts..."}
              {processingStep === 3 && "Setting up interactive quiz with explanations..."}
            </p>
          </div>

          {/* Processing Animation */}
          <div className="flex justify-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderReadyStep = () => (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Ready!</h2>
        <p className="text-gray-600">
          Your interactive quiz has been generated from: <span className="font-semibold">{title}</span>
        </p>
      </div>

      {/* Simple stats (optional static) */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quiz Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-left space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Sample Question:</h4>
              <p className="text-gray-700">Open the quiz to see all generated questions and explanations.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start Quiz Button */}
      <div className="flex flex-col items-center gap-4">
        <Button
          size="lg"
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
          onClick={() => onStartQuiz("quiz-section")}
        >
          <Play className="mr-2 h-5 w-5" />
          Start Quiz Now
        </Button>
        <Button variant="outline" onClick={onBackToDashboard}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  )

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {currentStep === "upload" && renderUploadStep()}
        {currentStep === "processing" && renderProcessingStep()}
        {currentStep === "ready" && renderReadyStep()}
      </div>
    </div>
  )
}
