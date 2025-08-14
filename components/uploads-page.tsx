"use client"

import { useState } from "react"
import { Upload, FileText, Trash2, Download, Eye, Calendar, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"

interface UploadedFile {
  id: string
  name: string
  type: string
  size: number
  uploadDate: string
  status: "processed" | "processing" | "failed"
  category: "document" | "presentation" | "spreadsheet" | "image" | "other"
  summaryGenerated: boolean
  quizGenerated: boolean
  flashcardsGenerated: boolean
}

interface UploadsPageProps {
  onBackToDashboard: () => void
  onUploadClick: () => void
  onViewSummary: (fileId: string) => void
  onViewQuiz: (fileId: string) => void
  onViewFlashcards: (fileId: string) => void
}

export function UploadsPage({
  onBackToDashboard,
  onUploadClick,
  onViewSummary,
  onViewQuiz,
  onViewFlashcards,
}: UploadsPageProps) {
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("date")

  // Sample uploaded files data
  const [uploadedFiles] = useState<UploadedFile[]>([
    {
      id: "1",
      name: "Introduction to Machine Learning.pdf",
      type: "application/pdf",
      size: 2.4 * 1024 * 1024, // 2.4 MB
      uploadDate: "2024-12-23T10:30:00Z",
      status: "processed",
      category: "document",
      summaryGenerated: true,
      quizGenerated: true,
      flashcardsGenerated: true,
    },
    {
      id: "2",
      name: "Data Structures and Algorithms.docx",
      type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      size: 1.8 * 1024 * 1024, // 1.8 MB
      uploadDate: "2024-12-22T14:15:00Z",
      status: "processed",
      category: "document",
      summaryGenerated: true,
      quizGenerated: false,
      flashcardsGenerated: true,
    },
    {
      id: "3",
      name: "Statistics Presentation.pptx",
      type: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      size: 5.2 * 1024 * 1024, // 5.2 MB
      uploadDate: "2024-12-21T09:45:00Z",
      status: "processing",
      category: "presentation",
      summaryGenerated: false,
      quizGenerated: false,
      flashcardsGenerated: false,
    },
    {
      id: "4",
      name: "Chemistry Notes.txt",
      type: "text/plain",
      size: 0.5 * 1024 * 1024, // 0.5 MB
      uploadDate: "2024-12-20T16:20:00Z",
      status: "processed",
      category: "document",
      summaryGenerated: true,
      quizGenerated: true,
      flashcardsGenerated: false,
    },
    {
      id: "5",
      name: "Physics Formulas.pdf",
      type: "application/pdf",
      size: 1.2 * 1024 * 1024, // 1.2 MB
      uploadDate: "2024-12-19T11:10:00Z",
      status: "failed",
      category: "document",
      summaryGenerated: false,
      quizGenerated: false,
      flashcardsGenerated: false,
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

  const getFileIcon = (type: string, category: string) => {
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

  const handleDeleteFile = (fileId: string, fileName: string) => {
    // In a real app, this would delete the file from the server
    toast({
      title: "File Deleted",
      description: `"${fileName}" has been removed from your uploads.`,
    })
  }

  const handleDownloadFile = (fileId: string, fileName: string) => {
    // In a real app, this would download the file
    toast({
      title: "Download Started",
      description: `Downloading "${fileName}"...`,
    })
  }

  const filteredFiles = uploadedFiles
    .filter((file) => {
      const matchesSearch = file.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterType === "all" || file.category === filterType
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "size":
          return b.size - a.size
        case "date":
        default:
          return new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()
      }
    })

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Upload className="h-8 w-8" />
              My Uploads
            </h2>
            <p className="text-gray-600">
              Manage your uploaded documents and generated content • {uploadedFiles.length} total files
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onBackToDashboard}>
              Back to Dashboard
            </Button>
            <Button onClick={onUploadClick} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="h-4 w-4 mr-2" />
              Upload New Files
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">{uploadedFiles.length}</p>
              <p className="text-sm text-gray-600">Total Files</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-8 w-8 mx-auto mb-2 text-green-600 text-2xl">📝</div>
              <p className="text-2xl font-bold text-gray-900">
                {uploadedFiles.filter((f) => f.summaryGenerated).length}
              </p>
              <p className="text-sm text-gray-600">Summaries Generated</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-8 w-8 mx-auto mb-2 text-purple-600 text-2xl">🧠</div>
              <p className="text-2xl font-bold text-gray-900">
                {uploadedFiles.filter((f) => f.flashcardsGenerated).length}
              </p>
              <p className="text-sm text-gray-600">Flashcard Sets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-8 w-8 mx-auto mb-2 text-orange-600 text-2xl">❓</div>
              <p className="text-2xl font-bold text-gray-900">{uploadedFiles.filter((f) => f.quizGenerated).length}</p>
              <p className="text-sm text-gray-600">Quizzes Available</p>
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
                    placeholder="Search files..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
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
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Files List */}
        <div className="space-y-4">
          {filteredFiles.length > 0 ? (
            filteredFiles.map((file) => (
              <Card key={file.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    {/* File Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{getFileIcon(file.type, file.category)}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 truncate">{file.name}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(file.uploadDate)}
                          </span>
                          <span>{formatFileSize(file.size)}</span>
                          <Badge variant="outline" className={getCategoryColor(file.category)}>
                            {file.category}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(file.status)}>
                            {file.status}
                          </Badge>
                        </div>

                        {/* Generated Content Status */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm text-gray-600">Generated:</span>
                          {file.summaryGenerated && (
                            <Badge variant="secondary" className="text-xs">
                              Summary
                            </Badge>
                          )}
                          {file.flashcardsGenerated && (
                            <Badge variant="secondary" className="text-xs">
                              Flashcards
                            </Badge>
                          )}
                          {file.quizGenerated && (
                            <Badge variant="secondary" className="text-xs">
                              Quiz
                            </Badge>
                          )}
                          {!file.summaryGenerated && !file.flashcardsGenerated && !file.quizGenerated && (
                            <span className="text-xs text-gray-400">None</span>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleDownloadFile(file.id, file.name)}>
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          {file.summaryGenerated && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewSummary(file.id)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Summary
                            </Button>
                          )}
                          {file.flashcardsGenerated && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewFlashcards(file.id)}
                              className="text-purple-600 hover:text-purple-700"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View Flashcards
                            </Button>
                          )}
                          {file.quizGenerated && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onViewQuiz(file.id)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              Take Quiz
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteFile(file.id, file.name)}
                            className="text-red-600 hover:text-red-700 ml-auto"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Upload className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No files found</h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterType !== "all"
                    ? "Try adjusting your search or filter criteria"
                    : "Upload your first document to get started"}
                </p>
                <Button onClick={onUploadClick} className="bg-blue-600 hover:bg-blue-700">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
