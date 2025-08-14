"use client"

import { useState } from "react"
import { History, FileText, Brain, HelpCircle, Trophy, Calendar, Search, Filter, Eye, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"

interface QuizAttempt {
  id: string
  attemptDate: string
  score: number
  accuracy: number
  totalQuestions: number
  correctAnswers: number
  timeSpent: number // in seconds
  difficulty: "mixed" | "easy" | "medium" | "hard"
}

interface GeneratedContent {
  summaryGenerated: boolean
  summaryGeneratedAt?: string
  flashcardsGenerated: boolean
  flashcardsGeneratedAt?: string
  flashcardsCount?: number
  quizGenerated: boolean
  quizGeneratedAt?: string
  quizAttempts: QuizAttempt[]
}

interface DocumentHistory {
  id: string
  name: string
  type: string
  size: number
  uploadDate: string
  category: "document" | "presentation" | "spreadsheet" | "image" | "other"
  status: "processed" | "processing" | "failed"
  generatedContent: GeneratedContent
  lastAccessed?: string
  totalStudyTime?: number // in minutes
}

interface HistoryPageProps {
  onBackToDashboard: () => void
  onViewDocument: (docId: string) => void
  onViewSummary: (docId: string) => void
  onViewFlashcards: (docId: string) => void
  onRetakeQuiz: (docId: string) => void
}

export function HistoryPage({
  onBackToDashboard,
  onViewDocument,
  onViewSummary,
  onViewFlashcards,
  onRetakeQuiz,
}: HistoryPageProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("uploadDate")
  const [selectedDocument, setSelectedDocument] = useState<DocumentHistory | null>(null)

  // Sample document history data
  const [documentHistory] = useState<DocumentHistory[]>([
    {
      id: "1",
      name: "Introduction to Machine Learning.pdf",
      type: "application/pdf",
      size: 2.4 * 1024 * 1024,
      uploadDate: "2024-12-20T10:30:00Z",
      category: "document",
      status: "processed",
      lastAccessed: "2024-12-23T15:45:00Z",
      totalStudyTime: 180, // 3 hours
      generatedContent: {
        summaryGenerated: true,
        summaryGeneratedAt: "2024-12-20T10:35:00Z",
        flashcardsGenerated: true,
        flashcardsGeneratedAt: "2024-12-20T10:40:00Z",
        flashcardsCount: 8,
        quizGenerated: true,
        quizGeneratedAt: "2024-12-20T10:45:00Z",
        quizAttempts: [
          {
            id: "q1",
            attemptDate: "2024-12-20T11:00:00Z",
            score: 85,
            accuracy: 85,
            totalQuestions: 10,
            correctAnswers: 8,
            timeSpent: 900, // 15 minutes
            difficulty: "mixed",
          },
          {
            id: "q2",
            attemptDate: "2024-12-22T14:30:00Z",
            score: 92,
            accuracy: 92,
            totalQuestions: 10,
            correctAnswers: 9,
            timeSpent: 720, // 12 minutes
            difficulty: "mixed",
          },
          {
            id: "q3",
            attemptDate: "2024-12-23T09:15:00Z",
            score: 78,
            accuracy: 78,
            totalQuestions: 10,
            correctAnswers: 7,
            timeSpent: 1080, // 18 minutes
            difficulty: "mixed",
          },
        ],
      },
    },
    {
      id: "2",
      name: "Data Structures and Algorithms.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 1.8 * 1024 * 1024,
      uploadDate: "2024-12-18T14:15:00Z",
      category: "document",
      status: "processed",
      lastAccessed: "2024-12-21T10:20:00Z",
      totalStudyTime: 240, // 4 hours
      generatedContent: {
        summaryGenerated: true,
        summaryGeneratedAt: "2024-12-18T14:20:00Z",
        flashcardsGenerated: true,
        flashcardsGeneratedAt: "2024-12-18T14:25:00Z",
        flashcardsCount: 12,
        quizGenerated: true,
        quizGeneratedAt: "2024-12-18T14:30:00Z",
        quizAttempts: [
          {
            id: "q4",
            attemptDate: "2024-12-19T16:45:00Z",
            score: 70,
            accuracy: 70,
            totalQuestions: 15,
            correctAnswers: 10,
            timeSpent: 1200, // 20 minutes
            difficulty: "mixed",
          },
          {
            id: "q5",
            attemptDate: "2024-12-21T10:30:00Z",
            score: 88,
            accuracy: 88,
            totalQuestions: 15,
            correctAnswers: 13,
            timeSpent: 1050, // 17.5 minutes
            difficulty: "mixed",
          },
        ],
      },
    },
    {
      id: "3",
      name: "Statistics Presentation.pptx",
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      size: 5.2 * 1024 * 1024,
      uploadDate: "2024-12-15T09:45:00Z",
      category: "presentation",
      status: "processed",
      lastAccessed: "2024-12-20T13:10:00Z",
      totalStudyTime: 90, // 1.5 hours
      generatedContent: {
        summaryGenerated: true,
        summaryGeneratedAt: "2024-12-15T09:50:00Z",
        flashcardsGenerated: false,
        quizGenerated: true,
        quizGeneratedAt: "2024-12-15T09:55:00Z",
        quizAttempts: [
          {
            id: "q6",
            attemptDate: "2024-12-16T11:20:00Z",
            score: 95,
            accuracy: 95,
            totalQuestions: 12,
            correctAnswers: 11,
            timeSpent: 840, // 14 minutes
            difficulty: "mixed",
          },
        ],
      },
    },
    {
      id: "4",
      name: "Chemistry Notes.txt",
      type: "text/plain",
      size: 0.5 * 1024 * 1024,
      uploadDate: "2024-12-12T16:20:00Z",
      category: "document",
      status: "processed",
      lastAccessed: "2024-12-18T08:30:00Z",
      totalStudyTime: 120, // 2 hours
      generatedContent: {
        summaryGenerated: true,
        summaryGeneratedAt: "2024-12-12T16:25:00Z",
        flashcardsGenerated: true,
        flashcardsGeneratedAt: "2024-12-12T16:30:00Z",
        flashcardsCount: 6,
        quizGenerated: false,
        quizAttempts: [],
      },
    },
    {
      id: "5",
      name: "Physics Formulas.pdf",
      type: "application/pdf",
      size: 1.2 * 1024 * 1024,
      uploadDate: "2024-12-10T11:10:00Z",
      category: "document",
      status: "failed",
      generatedContent: {
        summaryGenerated: false,
        flashcardsGenerated: false,
        quizGenerated: false,
        quizAttempts: [],
      },
    },
  ])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  const getFileIcon = (type: string) => {
    if (type.includes("pdf")) return "📄"
    if (type.includes("word") || type.includes("document")) return "📝"
    if (type.includes("presentation")) return "📊"
    if (type.includes("spreadsheet") || type.includes("excel")) return "📈"
    if (type.includes("text")) return "📋"
    if (type.includes("image")) return "🖼️"
    return "📁"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "processed":
        return "bg-green-100 text-green-800 border-green-200"
      case "processing":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "failed":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "document":
        return "bg-blue-100 text-blue-800"
      case "presentation":
        return "bg-purple-100 text-purple-800"
      case "spreadsheet":
        return "bg-green-100 text-green-800"
      case "image":
        return "bg-pink-100 text-pink-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 80) return "text-blue-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const getAverageScore = (attempts: QuizAttempt[]) => {
    if (attempts.length === 0) return 0
    return Math.round(attempts.reduce((sum, attempt) => sum + attempt.score, 0) / attempts.length)
  }

  const getBestScore = (attempts: QuizAttempt[]) => {
    if (attempts.length === 0) return 0
    return Math.max(...attempts.map((attempt) => attempt.score))
  }

  const getImprovementTrend = (attempts: QuizAttempt[]) => {
    if (attempts.length < 2) return "neutral"
    const latest = attempts[attempts.length - 1].score
    const previous = attempts[attempts.length - 2].score
    if (latest > previous) return "improving"
    if (latest < previous) return "declining"
    return "stable"
  }

  const filteredDocuments = documentHistory
    .filter((doc) => {
      const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterCategory === "all" || doc.category === filterCategory
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "size":
          return b.size - a.size
        case "lastAccessed":
          return new Date(b.lastAccessed || 0).getTime() - new Date(a.lastAccessed || 0).getTime()
        case "uploadDate":
        default:
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      }
    })

  const totalDocuments = documentHistory.length
  const processedDocuments = documentHistory.filter((doc) => doc.status === "processed").length
  const totalQuizAttempts = documentHistory.reduce((sum, doc) => sum + doc.generatedContent.quizAttempts.length, 0)
  const totalStudyTime = documentHistory.reduce((sum, doc) => sum + (doc.totalStudyTime || 0), 0)

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <History className="h-8 w-8" />
              Study History
            </h2>
            <p className="text-gray-600">
              Track your learning progress and review past study materials • {totalDocuments} documents uploaded
            </p>
          </div>
          <Button variant="outline" onClick={onBackToDashboard}>
            Back to Dashboard
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">{totalDocuments}</p>
              <p className="text-sm text-gray-600">Documents Uploaded</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Brain className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-gray-900">{processedDocuments}</p>
              <p className="text-sm text-gray-600">Successfully Processed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <HelpCircle className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-gray-900">{totalQuizAttempts}</p>
              <p className="text-sm text-gray-600">Quiz Attempts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold text-gray-900">{Math.round(totalStudyTime / 60)}h</p>
              <p className="text-sm text-gray-600">Total Study Time</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="presentation">Presentations</SelectItem>
                    <SelectItem value="spreadsheet">Spreadsheets</SelectItem>
                    <SelectItem value="image">Images</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="uploadDate">Upload Date</SelectItem>
                    <SelectItem value="lastAccessed">Last Accessed</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          {filteredDocuments.length > 0 ? (
            filteredDocuments.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    {/* Document Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{getFileIcon(doc.type)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-2 truncate">{doc.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Uploaded: {formatDate(doc.uploadDate)}
                          </span>
                          <span>{formatFileSize(doc.size)}</span>
                          <Badge variant="outline" className={getCategoryColor(doc.category)}>
                            {doc.category}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(doc.status)}>
                            {doc.status}
                          </Badge>
                        </div>

                        {doc.lastAccessed && (
                          <p className="text-xs text-gray-500 mb-3">Last accessed: {formatDate(doc.lastAccessed)}</p>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => onViewDocument(doc.id)}>
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDocument(selectedDocument?.id === doc.id ? null : doc)}
                      >
                        {selectedDocument?.id === doc.id ? "Hide Details" : "Show Details"}
                      </Button>
                    </div>
                  </div>

                  {/* Generated Content Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Summary */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Summary</span>
                      </div>
                      {doc.generatedContent.summaryGenerated ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            Generated
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => onViewSummary(doc.id)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                          Not Generated
                        </Badge>
                      )}
                    </div>

                    {/* Flashcards */}
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <Brain className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">Flashcards</span>
                      </div>
                      {doc.generatedContent.flashcardsGenerated ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            {doc.generatedContent.flashcardsCount} cards
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => onViewFlashcards(doc.id)}>
                            <Eye className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                          Not Generated
                        </Badge>
                      )}
                    </div>

                    {/* Quiz */}
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Quiz</span>
                      </div>
                      {doc.generatedContent.quizGenerated ? (
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                            {doc.generatedContent.quizAttempts.length} attempts
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => onRetakeQuiz(doc.id)}>
                            <RotateCcw className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                          Not Generated
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedDocument?.id === doc.id && (
                    <div className="border-t pt-4">
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="quiz-history">Quiz History</TabsTrigger>
                          <TabsTrigger value="study-analytics">Study Analytics</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Document Details</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">File Type:</span>
                                  <span>{doc.type.split("/").pop()?.toUpperCase()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Size:</span>
                                  <span>{formatFileSize(doc.size)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Status:</span>
                                  <Badge variant="outline" className={getStatusColor(doc.status)}>
                                    {doc.status}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Study Time:</span>
                                  <span>
                                    {doc.totalStudyTime
                                      ? `${Math.round(doc.totalStudyTime / 60)}h ${doc.totalStudyTime % 60}m`
                                      : "No data"}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Generated Content</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Summary:</span>
                                  <span
                                    className={
                                      doc.generatedContent.summaryGenerated ? "text-green-600" : "text-gray-400"
                                    }
                                  >
                                    {doc.generatedContent.summaryGenerated ? "✓ Generated" : "✗ Not generated"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Flashcards:</span>
                                  <span
                                    className={
                                      doc.generatedContent.flashcardsGenerated ? "text-green-600" : "text-gray-400"
                                    }
                                  >
                                    {doc.generatedContent.flashcardsGenerated
                                      ? `✓ ${doc.generatedContent.flashcardsCount} cards`
                                      : "✗ Not generated"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Quiz:</span>
                                  <span
                                    className={doc.generatedContent.quizGenerated ? "text-green-600" : "text-gray-400"}
                                  >
                                    {doc.generatedContent.quizGenerated ? "✓ Generated" : "✗ Not generated"}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Quiz Attempts:</span>
                                  <span>{doc.generatedContent.quizAttempts.length}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="quiz-history" className="space-y-4">
                          {doc.generatedContent.quizAttempts.length > 0 ? (
                            <>
                              {/* Quiz Performance Summary */}
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                <Card>
                                  <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-blue-600">
                                      {getAverageScore(doc.generatedContent.quizAttempts)}%
                                    </p>
                                    <p className="text-sm text-gray-600">Average Score</p>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4 text-center">
                                    <p className="text-2xl font-bold text-green-600">
                                      {getBestScore(doc.generatedContent.quizAttempts)}%
                                    </p>
                                    <p className="text-sm text-gray-600">Best Score</p>
                                  </CardContent>
                                </Card>
                                <Card>
                                  <CardContent className="p-4 text-center">
                                    <p
                                      className={`text-2xl font-bold ${
                                        getImprovementTrend(doc.generatedContent.quizAttempts) === "improving"
                                          ? "text-green-600"
                                          : getImprovementTrend(doc.generatedContent.quizAttempts) === "declining"
                                            ? "text-red-600"
                                            : "text-gray-600"
                                      }`}
                                    >
                                      {getImprovementTrend(doc.generatedContent.quizAttempts) === "improving"
                                        ? "📈"
                                        : getImprovementTrend(doc.generatedContent.quizAttempts) === "declining"
                                          ? "📉"
                                          : "➡️"}
                                    </p>
                                    <p className="text-sm text-gray-600">Trend</p>
                                  </CardContent>
                                </Card>
                              </div>

                              {/* Individual Quiz Attempts */}
                              <div className="space-y-3">
                                {doc.generatedContent.quizAttempts.map((attempt, index) => (
                                  <Card key={attempt.id}>
                                    <CardContent className="p-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <div>
                                          <h4 className="font-medium">
                                            Attempt #{doc.generatedContent.quizAttempts.length - index}
                                          </h4>
                                          <p className="text-sm text-gray-600">{formatDate(attempt.attemptDate)}</p>
                                        </div>
                                        <div className="text-right">
                                          <p className={`text-2xl font-bold ${getScoreColor(attempt.score)}`}>
                                            {attempt.score}%
                                          </p>
                                          <p className="text-sm text-gray-600">
                                            {attempt.correctAnswers}/{attempt.totalQuestions} correct
                                          </p>
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                          <p className="text-gray-600">Accuracy</p>
                                          <p className="font-medium">{attempt.accuracy}%</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Time Spent</p>
                                          <p className="font-medium">{formatDuration(attempt.timeSpent)}</p>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Difficulty</p>
                                          <Badge variant="outline" className="text-xs">
                                            {attempt.difficulty}
                                          </Badge>
                                        </div>
                                        <div>
                                          <p className="text-gray-600">Avg. per Question</p>
                                          <p className="font-medium">
                                            {formatDuration(Math.round(attempt.timeSpent / attempt.totalQuestions))}
                                          </p>
                                        </div>
                                      </div>

                                      {/* Progress Bar */}
                                      <div className="mt-3">
                                        <div className="flex justify-between text-xs text-gray-600 mb-1">
                                          <span>Progress</span>
                                          <span>
                                            {attempt.correctAnswers}/{attempt.totalQuestions}
                                          </span>
                                        </div>
                                        <Progress value={attempt.accuracy} className="h-2" />
                                      </div>
                                    </CardContent>
                                  </Card>
                                ))}
                              </div>
                            </>
                          ) : (
                            <div className="text-center py-8">
                              <HelpCircle className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Quiz Attempts</h3>
                              <p className="text-gray-600 mb-4">
                                {doc.generatedContent.quizGenerated
                                  ? "You haven't taken the quiz for this document yet."
                                  : "No quiz has been generated for this document."}
                              </p>
                              {doc.generatedContent.quizGenerated && (
                                <Button onClick={() => onRetakeQuiz(doc.id)}>Take Quiz</Button>
                              )}
                            </div>
                          )}
                        </TabsContent>

                        <TabsContent value="study-analytics" className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Study Patterns</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Total Study Time</span>
                                  <span className="font-medium">
                                    {doc.totalStudyTime
                                      ? `${Math.round(doc.totalStudyTime / 60)}h ${doc.totalStudyTime % 60}m`
                                      : "No data"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Quiz Time</span>
                                  <span className="font-medium">
                                    {doc.generatedContent.quizAttempts.length > 0
                                      ? formatDuration(
                                          doc.generatedContent.quizAttempts.reduce(
                                            (sum, attempt) => sum + attempt.timeSpent,
                                            0,
                                          ),
                                        )
                                      : "No data"}
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-sm text-gray-600">Learning Efficiency</span>
                                  <span className="font-medium">
                                    {doc.generatedContent.quizAttempts.length > 0
                                      ? `${getAverageScore(doc.generatedContent.quizAttempts)}% avg`
                                      : "No data"}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Performance Insights</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                {doc.generatedContent.quizAttempts.length > 0 ? (
                                  <>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Improvement Rate</span>
                                      <span
                                        className={`font-medium ${
                                          getImprovementTrend(doc.generatedContent.quizAttempts) === "improving"
                                            ? "text-green-600"
                                            : getImprovementTrend(doc.generatedContent.quizAttempts) === "declining"
                                              ? "text-red-600"
                                              : "text-gray-600"
                                        }`}
                                      >
                                        {getImprovementTrend(doc.generatedContent.quizAttempts) === "improving"
                                          ? "Improving"
                                          : getImprovementTrend(doc.generatedContent.quizAttempts) === "declining"
                                            ? "Declining"
                                            : "Stable"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Consistency</span>
                                      <span className="font-medium">
                                        {Math.abs(
                                          getBestScore(doc.generatedContent.quizAttempts) -
                                            getAverageScore(doc.generatedContent.quizAttempts),
                                        ) < 10
                                          ? "High"
                                          : "Moderate"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-sm text-gray-600">Mastery Level</span>
                                      <span className="font-medium">
                                        {getAverageScore(doc.generatedContent.quizAttempts) >= 90
                                          ? "Expert"
                                          : getAverageScore(doc.generatedContent.quizAttempts) >= 80
                                            ? "Advanced"
                                            : getAverageScore(doc.generatedContent.quizAttempts) >= 70
                                              ? "Intermediate"
                                              : "Beginner"}
                                      </span>
                                    </div>
                                  </>
                                ) : (
                                  <p className="text-sm text-gray-500">No performance data available</p>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <History className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterCategory !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Upload your first document to start building your study history"}
                </p>
                <Button onClick={onBackToDashboard}>Go to Dashboard</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
