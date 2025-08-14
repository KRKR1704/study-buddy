"use client"

import type React from "react"

import { useState } from "react"
import { Calendar, Clock, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { useTasks } from "../contexts/task-context"
import { useToast } from "@/hooks/use-toast"

interface AddTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddTaskModal({ open, onOpenChange }: AddTaskModalProps) {
  const { addTask } = useTasks()
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    hasDeadline: false,
    deadlineDate: "",
    deadlineTime: "",
    taskType: "assignment" as const,
    hoursPerDay: 1,
    priority: "medium" as const,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Create the task object
      const taskData = {
        title: formData.title,
        description: formData.description || undefined,
        date: formData.hasDeadline ? formData.deadlineDate : new Date().toISOString().split("T")[0],
        time: formData.hasDeadline && formData.deadlineTime ? formData.deadlineTime : undefined,
        type: formData.taskType,
        priority: formData.priority,
        hoursPerDay: formData.hoursPerDay,
      }

      // Add the task using context
      addTask(taskData)

      // Reset form
      setFormData({
        title: "",
        description: "",
        hasDeadline: false,
        deadlineDate: "",
        deadlineTime: "",
        taskType: "assignment",
        hoursPerDay: 1,
        priority: "medium",
      })

      // Close modal
      onOpenChange(false)

      // Show success toast
      toast({
        title: "Task Created Successfully!",
        description: `"${taskData.title}" has been added to your calendar.`,
      })
    } catch (error) {
      toast({
        title: "Error Creating Task",
        description: "There was an error creating your task. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Add New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Task Title *</Label>
            <Input
              id="title"
              placeholder="Enter task title (e.g., Math Assignment Chapter 5)"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
            />
          </div>

          {/* Task Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Add any additional details about the task..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              rows={3}
            />
          </div>

          {/* Task Type */}
          <div className="space-y-2">
            <Label htmlFor="taskType">Task Type</Label>
            <Select value={formData.taskType} onValueChange={(value) => handleInputChange("taskType", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assignment">📝 Assignment</SelectItem>
                <SelectItem value="exam">📚 Exam Preparation</SelectItem>
                <SelectItem value="project">🎯 Project</SelectItem>
                <SelectItem value="reading">📖 Reading</SelectItem>
                <SelectItem value="practice">✏️ Practice</SelectItem>
                <SelectItem value="research">🔍 Research</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Priority Level */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">🟢 Low Priority</SelectItem>
                <SelectItem value="medium">🟡 Medium Priority</SelectItem>
                <SelectItem value="high">🟠 High Priority</SelectItem>
                <SelectItem value="urgent">🔴 Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Hours Per Day */}
          <div className="space-y-2">
            <Label htmlFor="hoursPerDay" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hours Per Day *
            </Label>
            <div className="flex items-center space-x-4">
              <Input
                id="hoursPerDay"
                type="number"
                min="0.5"
                max="12"
                step="0.5"
                value={formData.hoursPerDay}
                onChange={(e) => handleInputChange("hoursPerDay", Number.parseFloat(e.target.value))}
                className="w-24"
                required
              />
              <span className="text-sm text-muted-foreground">
                How many hours can you dedicate to this task per day?
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Recommended: 1-3 hours for assignments, 2-4 hours for exam prep
            </div>
          </div>

          {/* Deadline Toggle */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasDeadline"
                checked={formData.hasDeadline}
                onCheckedChange={(checked) => handleInputChange("hasDeadline", checked)}
              />
              <Label htmlFor="hasDeadline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                This task has a deadline
              </Label>
            </div>

            {/* Deadline Date and Time */}
            {formData.hasDeadline && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="deadlineDate">Deadline Date *</Label>
                  <Input
                    id="deadlineDate"
                    type="date"
                    value={formData.deadlineDate}
                    onChange={(e) => handleInputChange("deadlineDate", e.target.value)}
                    min={new Date().toISOString().split("T")[0]}
                    required={formData.hasDeadline}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deadlineTime">Deadline Time</Label>
                  <Input
                    id="deadlineTime"
                    type="time"
                    value={formData.deadlineTime}
                    onChange={(e) => handleInputChange("deadlineTime", e.target.value)}
                  />
                  <div className="text-xs text-muted-foreground">Leave empty if no specific time</div>
                </div>
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!formData.title || (formData.hasDeadline && !formData.deadlineDate)}>
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
