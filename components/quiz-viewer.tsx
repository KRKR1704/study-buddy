"use client"

import { useMemo, useEffect, useState } from "react"
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Clock, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

type Difficulty = "easy" | "medium" | "hard"

export interface QuizViewerProps {
  onComplete: () => void
  entryPoint: "summary" | "flashcards" | "quiz-section"
}

type AnyQuizItem = {
  question?: string
  // can be: string[], {A:string,...}, [{label:'A',text:'...'}], [{A:'...'}], etc.
  options?: any
  correct?: string | number
  answer?: string | number
  answerIndex?: number
  correctIndex?: number
  correctOption?: string // e.g. "A"
  explanation?: string
  category?: string
}

interface QuizQuestionUI {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  difficulty: Difficulty
  category: string
}

interface QuizResult {
  questionId: number
  selectedAnswer: number
  isCorrect: boolean
  timeSpent: number
}

/* ---------- helpers ---------- */

function cleanText(s: unknown): string {
  return typeof s === "string" ? s.trim() : ""
}

// normalize options into a simple array of strings
function toOptionArray(input: any): string[] | null {
  if (!input) return null

  // 1) already a string array
  if (Array.isArray(input)) {
    if (input.length === 0) return []
    // array of strings
    if (typeof input[0] === "string") {
      return (input as string[]).map(cleanText).filter(Boolean)
    }
    // array of objects
    if (typeof input[0] === "object" && input[0] !== null) {
      const arr: string[] = []
      for (const obj of input as Array<Record<string, any>>) {
        if (!obj) continue
        // { label: "A", text: "..." }
        if (typeof obj.text === "string") {
          arr.push(cleanText(obj.text))
          continue
        }
        // { value: "..." }
        if (typeof obj.value === "string") {
          arr.push(cleanText(obj.value))
          continue
        }
        // { A: "..." } — take the first string value
        const vals = Object.values(obj).filter((v) => typeof v === "string") as string[]
        if (vals.length) {
          arr.push(cleanText(vals[0]))
        }
      }
      return arr.filter(Boolean)
    }
    return null
  }

  // 2) plain object like {A: "...", B: "..."}
  if (typeof input === "object") {
    const entries = Object.entries(input as Record<string, any>)
      .filter(([, v]) => typeof v === "string")
      .sort(([a], [b]) => a.localeCompare(b)) // A,B,C,D order if present
    return entries.map(([, v]) => cleanText(v)).filter(Boolean)
  }

  return null
}

function letterToIndex(letter?: string): number | null {
  if (!letter || typeof letter !== "string") return null
  const idx = letter.trim().toUpperCase().charCodeAt(0) - 65 // A -> 0
  return idx >= 0 && idx < 26 ? idx : null
}

function valueToIndex(v: string | number | undefined, options: string[]): number | null {
  if (typeof v === "number") return v >= 0 && v < options.length ? v : null
  if (typeof v === "string") {
    // try letter (A/B/C/D)
    const li = letterToIndex(v)
    if (li !== null && li < options.length) return li
    // try exact text match
    const eq = options.findIndex((o) => o.trim() === v.trim())
    return eq >= 0 ? eq : null
  }
  return null
}

function inferDifficulty(question: string, options: string[]): Difficulty {
  const n = (question || "").length + options.join(" ").length
  return n < 120 ? "easy" : n < 280 ? "medium" : "hard"
}

function normalizeQuiz(items: unknown): QuizQuestionUI[] {
  if (!Array.isArray(items)) return []
  const out: QuizQuestionUI[] = []

  ;(items as AnyQuizItem[]).forEach((raw, i) => {
    const question = cleanText(raw?.question) || `Question ${i + 1}`

    // robust options normalization (handles many shapes)
    let options = toOptionArray(raw?.options) || []
    // ensure exactly 4 visible options so UI is consistent
    options = options.filter(Boolean).slice(0, 4)
    while (options.length < 4) {
      options.push(`Option ${options.length + 1}`)
    }
    if (options.length === 0) return

    // resolve correct answer across many possible fields
    let correct =
      valueToIndex(raw?.answerIndex as any, options) ??
      valueToIndex(raw?.correctIndex as any, options) ??
      valueToIndex(raw?.correctOption as any, options) ??
      valueToIndex(raw?.answer as any, options) ??
      valueToIndex(raw?.correct as any, options) ??
      0

    if (correct === null || correct < 0 || correct >= options.length) correct = 0

    const explanation = cleanText(raw?.explanation) || `The correct answer is "${options[correct]}".`

    out.push({
      id: i + 1,
      question,
      options,
      correctAnswer: correct,
      explanation,
      difficulty: inferDifficulty(question, options),
      category: cleanText(raw?.category) || "General",
    })
  })

  return out
}

const diffBadge = (d: Difficulty) =>
  d === "easy"
    ? "bg-green-100 text-green-800"
    : d === "medium"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-red-100 text-red-800"

/* ---------- main ---------- */

export function QuizViewer({ onComplete, entryPoint }: QuizViewerProps) {
  const questions = useMemo<QuizQuestionUI[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("sb_quiz")
        if (raw) {
          const parsed = JSON.parse(raw)
          const norm = normalizeQuiz(parsed)
          if (norm.length) return norm
        }
      } catch {}
    }
    // fallback demo
    return [
      {
        id: 1,
        question: "Fallback: What does ML stand for?",
        options: ["Meta Learning", "Machine Learning", "Master List", "Model Length"],
        correctAnswer: 1,
        explanation: 'It stands for "Machine Learning".',
        difficulty: "easy",
        category: "Definition",
      },
    ]
  }, [])

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [results, setResults] = useState<QuizResult[]>([])
  const [startTime, setStartTime] = useState(Date.now())
  const [done, setDone] = useState(false)
  const [timeLeft, setTimeLeft] = useState(900)

  useEffect(() => {
    if (!done && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
      return () => clearTimeout(t)
    } else if (timeLeft === 0 && !done) {
      setDone(true)
    }
  }, [timeLeft, done])

  if (!questions.length) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-gray-700">No quiz found. Generate a summary first.</p>
          <Button variant="outline" className="mt-4" onClick={onComplete}>
            Back
          </Button>
        </div>
      </div>
    )
  }

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).toString().padStart(2, "0")}`

  const handleSubmit = () => {
    if (selected === null) return
    const q = questions[current]
    const isCorrect = selected === q.correctAnswer
    const timeSpent = Date.now() - startTime
    setResults((prev) => [...prev, { questionId: q.id, selectedAnswer: selected, isCorrect, timeSpent }])
    setShowResult(true)
  }

  const handleNext = () => {
    if (current < questions.length - 1) {
      setCurrent((i) => i + 1)
      setSelected(null)
      setShowResult(false)
      setStartTime(Date.now())
    } else {
      setDone(true)
    }
  }

  /* ---------- completed view ---------- */
  if (done) {
    const correct = results.filter((r) => r.isCorrect).length
    const score = Math.round((correct / Math.max(1, questions.length)) * 100)
    const totalTime = results.reduce((sum, r) => sum + r.timeSpent, 0)
    const avg = totalTime / Math.max(1, questions.length) / 1000
    const scoreColor = score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-red-600"
    const msg =
      score >= 90
        ? "Excellent! Outstanding performance!"
        : score >= 80
          ? "Great job! You have a solid understanding!"
          : score >= 70
            ? "Good work! Keep studying to improve!"
            : score >= 60
              ? "Not bad! Review the material and try again!"
              : "Keep studying! Practice makes perfect!"

    return (
      <div className="flex-1 p-6 bg-gradient-to-br from-green-50 to-blue-50 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Quiz Complete!</h2>
            <p className="text-gray-600">{msg}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <p className={`text-3xl font-bold ${scoreColor}`}>{score}%</p>
                <p className="text-sm text-gray-600">Final Score</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <p className="text-3xl font-bold text-gray-900">
                  {correct}/{questions.length}
                </p>
                <p className="text-sm text-gray-600">Correct Answers</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Clock className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <p className="text-3xl font-bold text-gray-900">{avg.toFixed(1)}s</p>
                <p className="text-sm text-gray-600">Avg. per Question</p>
              </CardContent>
            </Card>
          </div>

          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Question Review</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {questions.map((q, i) => {
                  const r = results[i]
                  const ok = r?.isCorrect
                  return (
                    <div
                      key={q.id}
                      className={`p-4 rounded-lg border-l-4 ${ok ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">Q{i + 1}: {q.question}</h4>
                        {ok ? <CheckCircle className="h-5 w-5 text-green-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
                      </div>
                      <div className="text-sm space-y-2">
                        <div><span className="font-medium">Your answer:</span> {typeof r?.selectedAnswer === "number" ? q.options[r.selectedAnswer] : "—"}</div>
                        {!ok && <div><span className="font-medium">Correct answer:</span> {q.options[q.correctAnswer]}</div>}
                        <div className="mt-3 p-3 bg-blue-50 rounded">
                          <span className="font-medium text-blue-900">Explanation: </span>
                          <span className="text-blue-800">{q.explanation}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center gap-4">
            <Button onClick={onComplete} size="lg" className="bg-blue-600 hover:bg-blue-700">
              {entryPoint === "quiz-section" ? "Back to Dashboard" : "Back"}
            </Button>
            <Button variant="outline" size="lg" onClick={() => window.location.reload()}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Retake Quiz
            </Button>
          </div>
        </div>
      </div>
    )
  }

  /* ---------- live view ---------- */
  const q = questions[current]
  const progress = ((current + 1) / questions.length) * 100
  const difficultyClass =
    q.difficulty === "easy"
      ? "bg-green-100 text-green-800"
      : q.difficulty === "medium"
        ? "bg-yellow-100 text-yellow-800"
        : "bg-red-100 text-red-800"

  return (
    <div className="flex-1 p-6 bg-gradient-to-br from-blue-50 to-purple-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quiz</h2>
            <p className="text-gray-600">Question {current + 1} of {questions.length}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
            <Badge className={difficultyClass}>{q.difficulty.toUpperCase()}</Badge>
            <Badge variant="outline">{q.category}</Badge>
          </div>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <Card className="mb-8">
          <CardHeader><CardTitle className="text-xl">{q.question}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {q.options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => (!showResult ? setSelected(index) : null)}
                  disabled={showResult}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selected === index
                      ? showResult
                        ? index === q.correctAnswer
                          ? "border-green-500 bg-green-50 text-green-800"
                          : "border-red-500 bg-red-50 text-red-800"
                        : "border-blue-500 bg-blue-50"
                      : showResult && index === q.correctAnswer
                        ? "border-green-500 bg-green-50 text-green-800"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  } ${showResult ? "cursor-default" : "cursor-pointer"}`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm font-bold ${
                        selected === index
                          ? showResult
                            ? index === q.correctAnswer
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-red-500 bg-red-500 text-white"
                            : "border-blue-500 bg-blue-500 text-white"
                          : showResult && index === q.correctAnswer
                            ? "border-green-500 bg-green-500 text-white"
                            : "border-gray-300"
                      }`}
                    >
                      {String.fromCharCode(65 + index)}
                    </div>
                    <span className="flex-1">{option}</span>
                    {showResult && selected === index && index !== q.correctAnswer && (
                      <XCircle className="h-5 w-5 text-red-500" />
                    )}
                    {showResult && index === q.correctAnswer && (
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Explanation */}
        {showResult && (
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <h4 className="font-semibold text-blue-900 mb-2">Explanation:</h4>
              <p className="text-blue-800 leading-relaxed">{q.explanation}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center">
          {!showResult ? (
            <Button onClick={handleSubmit} disabled={selected === null} size="lg" className="bg-blue-600 hover:bg-blue-700">
              Submit Answer
            </Button>
          ) : (
            <Button onClick={handleNext} size="lg" className="bg-green-600 hover:bg-green-700">
              {current < questions.length - 1 ? (
                <>
                  Next Question
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              ) : (
                "View Results"
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
