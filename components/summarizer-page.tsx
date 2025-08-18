"use client"

import type React from "react"
import { useState } from "react"
import { Upload, FileText, ArrowRight, CheckCircle, Loader2, Eye, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface SummarizerPageProps {
  onBackToDashboard: () => void
  onViewFlashcards: () => void
  onViewQuiz: () => void
}

type SummarizerStep = "upload" | "processing" | "results"
type ProcessingStep = 1 | 2 | 3

type Flashcard = { front: string; back: string }
type QuizItem = { question: string; options: string[]; answerIndex: number; explanation?: string }

// Prefer env; fallback to local dev
const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8000").replace(/\/+$/, "")
const API_URL = `${API_BASE}/api/summarize/`

export function SummarizerPage({ onBackToDashboard, onViewFlashcards, onViewQuiz }: SummarizerPageProps) {
  const [currentStep, setCurrentStep] = useState<SummarizerStep>("upload")
  const [processingStep, setProcessingStep] = useState<ProcessingStep>(1)
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // result state from backend
  const [summary, setSummary] = useState<string>("")
  const [keyPoints, setKeyPoints] = useState<string[]>([])
  const [wordCount, setWordCount] = useState<number>(0)
  const [readingTime, setReadingTime] = useState<string>("0 min")
  const [title, setTitle] = useState<string>("Summary")

  // ---------- drag & drop / file selection ----------
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

  // ---------- helpers ----------
  const computeWordStats = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean)
    const wc = words.length
    const minutes = Math.max(1, Math.ceil(wc / 200)) // ~200 wpm
    setWordCount(wc)
    setReadingTime(`${minutes} min`)
  }

  // ---------- main action ----------
  const startProcessing = async () => {
    if (uploadedFiles.length === 0 || isSubmitting) return

    const allowed = [
      ".pdf", ".docx", ".pptx", ".txt", ".rtf", ".md", ".markdown", ".html", ".htm", ".csv", ".xlsx", ".epub"
    ]
    const name = uploadedFiles[0].name
    const ext = `.${(name.split(".").pop() || "").toLowerCase()}`
    if (!allowed.includes(ext)) {
      alert("Unsupported file type. Please upload a text document (PDF/DOCX/PPTX/TXT/RTF/MD/HTML/CSV/XLSX/EPUB).")
      return
    }

    // clear previous results so other pages don't show stale data
    localStorage.removeItem("sb_flashcards")
    localStorage.removeItem("sb_quiz")
    localStorage.removeItem("sb_summary")
    localStorage.removeItem("sb_keypoints")

    setIsSubmitting(true)
    setCurrentStep("processing")
    setProcessingStep(1)

    const timers: number[] = []
    timers.push(window.setTimeout(() => setProcessingStep(2), 900))
    timers.push(window.setTimeout(() => setProcessingStep(3), 1800))

    try {
      const file = uploadedFiles[0]
      setTitle(file.name.replace(/\.[^.]+$/, "") || "Summary")

      const form = new FormData()
      form.append("file", file)

      const res = await fetch(API_URL, { method: "POST", body: form })
      if (!res.ok) {
        const errText = await res.text().catch(() => "")
        throw new Error(errText || `Request failed with status ${res.status}`)
      }

      const json = await res.json()
      if (!json?.success) {
        throw new Error(json?.error || "Summarization failed on the server.")
      }

      // expected: { success: true, data: { summary, keyTakeaways, flashcards, quiz } }
      const data = json.data || {}
      const textSummary: string = data.summary || ""

      setSummary(textSummary)
      computeWordStats(textSummary)

      // Prefer backend keyTakeaways; fallback to deriving if absent
      const backendKp: string[] = Array.isArray(data.keyTakeaways) ? data.keyTakeaways : []
      const kp = backendKp.length ? backendKp : deriveKeyPoints(textSummary)
      setKeyPoints(kp)

      // persist for other pages
      localStorage.setItem("sb_summary", textSummary)
      localStorage.setItem("sb_keypoints", JSON.stringify(kp))

      if (Array.isArray(data.flashcards)) {
        localStorage.setItem("sb_flashcards", JSON.stringify(data.flashcards as Flashcard[]))
      }
      if (Array.isArray(data.quiz)) {
        localStorage.setItem("sb_quiz", JSON.stringify(data.quiz as QuizItem[]))
      }

      await new Promise((r) => setTimeout(r, 600))
      setCurrentStep("results")
    } catch (err: any) {
      console.error(err)
      alert(err?.message || "Something went wrong while summarizing. Please try again.")
      setCurrentStep("upload")
    } finally {
      setIsSubmitting(false)
      timers.forEach((t) => window.clearTimeout(t))
    }
  }

  // Simple fallback bullet derivation (only used if backend didn't return keyTakeaways)
  const deriveKeyPoints = (text: string): string[] => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
    const bullets = lines.filter((l) => /^(\*|-|•|\d+[.)])\s+/.test(l))
    if (bullets.length > 0) return bullets.map((b) => b.replace(/^(\*|-|•|\d+[.)])\s+/, ""))
    const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean)
    return sentences.slice(0, 7)
  }

  const getStepStatus = (step: ProcessingStep) => {
    if (processingStep > step) return "completed"
    if (processingStep === step) return "active"
    return "pending"
  }

  const getStepText = (step: ProcessingStep) => {
    switch (step) {
      case 1: return "Reading the document"
      case 2: return "Generating summary"
      case 3: return "Finalizing results"
    }
  }

  // ---------- UI sections ----------
  const renderUploadStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <FileText className="h-8 w-8" />
          Document Summarizer
        </h2>
        <p className="text-gray-600">Upload your documents and get AI-powered summaries, flashcards, and quizzes</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Upload Documents</CardTitle>
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
            <p className="text-lg font-medium text-gray-900 mb-2">Drop files here or click to browse</p>
            <p className="text-sm text-gray-500 mb-4">
              Supports PDF, DOCX, PPTX, TXT, RTF, MD/Markdown, HTML/HTM, CSV, XLSX, EPUB
            </p>

            <input
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              id="file-input"
              accept=".pdf,.docx,.pptx,.txt,.rtf,.md,.markdown,.html,.htm,.csv,.xlsx,.epub"
            />
            <Button asChild>
              <label htmlFor="file-input" className="cursor-pointer">
                Choose Files
              </label>
            </Button>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="font-medium mb-3">Selected Files:</h4>
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
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isSubmitting ? "Starting..." : "Start Summarizing"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  const renderProcessingStep = () => (
    <div className="max-w-2xl mx-auto text-center">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Processing Your Document</h2>
        <p className="text-gray-600">Please wait while we analyze and summarize your content</p>
      </div>

      <Card className="p-8">
        <div className="space-y-8">
          {/* Steps */}
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
              {processingStep === 1 && "Analyzing document structure and extracting key information..."}
              {processingStep === 2 && "Creating comprehensive summary and identifying main concepts..."}
              {processingStep === 3 && "Preparing flashcards and quiz questions for enhanced learning..."}
            </p>
          </div>

          {/* Processing Animation */}
          <div className="flex justify-center">
            <div className="flex space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )

  const renderResultsStep = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Summary Complete!</h2>
        <p className="text-gray-600">Your document has been successfully analyzed and summarized</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
            <p className="text-2xl font-bold text-gray-900">{wordCount}</p>
            <p className="text-sm text-gray-600">Words Processed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Eye className="h-8 w-8 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold text-gray-900">{readingTime}</p>
            <p className="text-sm text-gray-600">Reading Time</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Brain className="h-8 w-8 mx-auto mb-2 text-purple-600" />
            <p className="text-2xl font-bold text-gray-900">{keyPoints.length}</p>
            <p className="text-sm text-gray-600">Key Points</p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Content */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="whitespace-pre-line text-gray-700 leading-relaxed">{summary}</div>
          </div>
        </CardContent>
      </Card>

      {/* Key Points */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Key Takeaways</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {keyPoints.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <span className="text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white" onClick={onViewFlashcards}>
          <Brain className="mr-2 h-5 w-5" />
          View Flash Cards
        </Button>
        <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white" onClick={onViewQuiz}>
          <FileText className="mr-2 h-5 w-5" />
          View Quiz
        </Button>
      </div>

      <div className="mt-8 text-center">
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
        {currentStep === "results" && renderResultsStep()}
      </div>
    </div>
  )
}
