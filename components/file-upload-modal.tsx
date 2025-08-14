"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, X, File, Cloud } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface FileUploadModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FileUploadModal({ open, onOpenChange }: FileUploadModalProps) {
  const [dragActive, setDragActive] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const newFiles = Array.from(e.dataTransfer.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleGoogleDriveConnect = () => {
    // Placeholder for Google Drive integration
    alert("Google Drive integration would be implemented here")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="local" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="local">Local Files</TabsTrigger>
            <TabsTrigger value="drive">Google Drive</TabsTrigger>
          </TabsList>

          <TabsContent value="local" className="space-y-4">
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
              <p className="text-sm text-gray-500 mb-4">Support for PDF, DOC, TXT, and more</p>
              <input
                type="file"
                multiple
                onChange={handleFileInput}
                className="hidden"
                id="file-input"
                accept=".pdf,.doc,.docx,.txt,.ppt,.pptx"
              />
              <Button asChild>
                <label htmlFor="file-input" className="cursor-pointer">
                  Choose Files
                </label>
              </Button>
            </div>

            {files.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Selected Files:</h4>
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <File className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                      <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => removeFile(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="drive" className="space-y-4">
            <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <Cloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">Connect to Google Drive</p>
              <p className="text-sm text-gray-500 mb-4">Access your files stored in Google Drive</p>
              <Button onClick={handleGoogleDriveConnect}>Connect Google Drive</Button>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              // Handle file upload logic here
              console.log("Uploading files:", files)
              onOpenChange(false)
            }}
            disabled={files.length === 0}
          >
            Upload {files.length > 0 && `(${files.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
