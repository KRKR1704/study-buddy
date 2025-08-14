"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, Clock, AlertCircle, Trash2, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTasks } from "../contexts/task-context"
import { useToast } from "@/hooks/use-toast"

interface CalendarPageProps {
  onAddTaskClick: () => void
}

interface GoogleEvent {
  id: string
  title: string
  date: string
  time?: string
  type: "reminder" | "meeting" | "event"
}

export function CalendarPage({ onAddTaskClick }: CalendarPageProps) {
  const { tasks, updateTask, deleteTask } = useTasks()
  const { toast } = useToast()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)

  // Sample Google Calendar events
  const [googleEvents] = useState<GoogleEvent[]>([
    {
      id: "g1",
      title: "Team Meeting",
      date: "2024-12-27",
      time: "10:00",
      type: "meeting",
    },
    {
      id: "g2",
      title: "Doctor Appointment",
      date: "2024-12-30",
      time: "14:30",
      type: "reminder",
    },
  ])

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }

    return days
  }

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev)
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const getEventsForDate = (date: Date) => {
    const dateString = date.toISOString().split("T")[0]
    const dayTasks = tasks.filter((task) => task.date === dateString)
    const dayGoogleEvents = isGoogleConnected ? googleEvents.filter((event) => event.date === dateString) : []
    return { tasks: dayTasks, googleEvents: dayGoogleEvents }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500"
      case "high":
        return "bg-orange-500"
      case "medium":
        return "bg-yellow-500"
      case "low":
        return "bg-green-500"
      default:
        return "bg-gray-500"
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200"
      case "high":
        return "bg-orange-100 text-orange-800 border-orange-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "assignment":
        return "📝"
      case "exam":
        return "📚"
      case "project":
        return "🎯"
      case "reading":
        return "📖"
      case "practice":
        return "✏️"
      case "research":
        return "🔍"
      case "meeting":
        return "👥"
      case "reminder":
        return "⏰"
      case "event":
        return "📅"
      default:
        return "📋"
    }
  }

  const connectGoogleCalendar = () => {
    // In a real app, this would initiate Google OAuth flow
    setIsGoogleConnected(true)
    toast({
      title: "Google Calendar Connected!",
      description: "Your Google Calendar events will now appear here.",
    })
  }

  const handleDeleteTask = (taskId: string, taskTitle: string) => {
    deleteTask(taskId)
    toast({
      title: "Task Deleted",
      description: `"${taskTitle}" has been removed from your calendar.`,
    })
  }

  const handleToggleTaskComplete = (taskId: string, completed: boolean, taskTitle: string) => {
    updateTask(taskId, { completed })
    toast({
      title: completed ? "Task Completed!" : "Task Reopened",
      description: completed ? `Great job completing "${taskTitle}"!` : `"${taskTitle}" has been marked as incomplete.`,
    })
  }

  const days = getDaysInMonth(currentDate)

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <CalendarIcon className="h-8 w-8" />
              Study Calendar
            </h2>
            <p className="text-gray-600">
              Manage your tasks and sync with Google Calendar • {tasks.length} total tasks
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!isGoogleConnected && (
              <Button variant="outline" onClick={connectGoogleCalendar}>
                Connect Google Calendar
              </Button>
            )}
            {isGoogleConnected && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Google Calendar Connected
              </Badge>
            )}
            <Button onClick={onAddTaskClick}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-3">
            <Card>
              <div className="p-6">
                {/* Calendar Header */}
                <div className="flex items-center justify-between mb-6">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <h3 className="text-xl font-semibold">
                    {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                  </h3>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, index) => {
                    if (!day) {
                      return <div key={index} className="p-1 h-32" />
                    }

                    const { tasks: dayTasks, googleEvents: dayGoogleEvents } = getEventsForDate(day)
                    const isToday = day.toDateString() === new Date().toDateString()
                    const isSelected = selectedDate?.toDateString() === day.toDateString()

                    return (
                      <div
                        key={index}
                        className={`p-2 h-32 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                          isToday ? "bg-blue-50 border-blue-300" : ""
                        } ${isSelected ? "bg-blue-100 border-blue-400" : ""}`}
                        onClick={() => setSelectedDate(day)}
                      >
                        <div className="h-full flex flex-col">
                          <div className={`text-sm font-medium mb-2 ${isToday ? "text-blue-600" : ""}`}>
                            {day.getDate()}
                          </div>
                          <div className="flex-1 overflow-hidden space-y-1">
                            {dayTasks.slice(0, 2).map((task) => (
                              <div
                                key={task.id}
                                className={`text-xs p-1 rounded text-white truncate ${getPriorityColor(task.priority)} ${
                                  task.completed ? "opacity-50 line-through" : ""
                                }`}
                                title={task.title}
                              >
                                {getTypeIcon(task.type)} {task.title}
                              </div>
                            ))}
                            {dayGoogleEvents.slice(0, 1).map((event) => (
                              <div
                                key={event.id}
                                className="text-xs p-1 rounded bg-purple-500 text-white truncate"
                                title={event.title}
                              >
                                {getTypeIcon(event.type)} {event.title}
                              </div>
                            ))}
                            {dayTasks.length + dayGoogleEvents.length > 3 && (
                              <div className="text-xs text-gray-500">
                                +{dayTasks.length + dayGoogleEvents.length - 3} more
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Card>
          </div>

          {/* Side Panel - Fixed alignment and spacing */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <div className="p-4">
                {selectedDate ? (
                  <div className="space-y-4">
                    {/* Date Header */}
                    <div className="text-center pb-3 border-b">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {selectedDate.toLocaleDateString("en-US", {
                          weekday: "long",
                        })}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {selectedDate.toLocaleDateString("en-US", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>

                    <Tabs defaultValue="tasks" className="w-full">
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="tasks" className="text-sm">
                          Tasks ({getEventsForDate(selectedDate).tasks.length})
                        </TabsTrigger>
                        <TabsTrigger value="events" className="text-sm">
                          Events ({getEventsForDate(selectedDate).googleEvents.length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="tasks" className="space-y-3">
                        {getEventsForDate(selectedDate).tasks.length > 0 ? (
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {getEventsForDate(selectedDate).tasks.map((task) => (
                              <Card key={task.id} className="border border-gray-200 hover:shadow-sm transition-shadow">
                                <CardContent className="p-4">
                                  {/* Task Header */}
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <span className="text-lg flex-shrink-0">{getTypeIcon(task.type)}</span>
                                      <h4
                                        className={`font-medium text-sm leading-tight ${
                                          task.completed ? "line-through text-gray-500" : "text-gray-900"
                                        }`}
                                        title={task.title}
                                      >
                                        {task.title}
                                      </h4>
                                    </div>
                                    <Badge
                                      variant="outline"
                                      className={`text-xs font-medium flex-shrink-0 ml-2 ${getPriorityBadgeColor(
                                        task.priority,
                                      )}`}
                                    >
                                      {task.priority.toUpperCase()}
                                    </Badge>
                                  </div>

                                  {/* Task Details */}
                                  <div className="space-y-2 mb-4">
                                    {task.time && (
                                      <div className="flex items-center gap-2 text-xs text-gray-600">
                                        <Clock className="h-3 w-3 flex-shrink-0" />
                                        <span>Due at {task.time}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-gray-600">
                                      <AlertCircle className="h-3 w-3 flex-shrink-0" />
                                      <span>{task.hoursPerDay} hours per day</span>
                                    </div>
                                    {task.description && (
                                      <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                        {task.description}
                                      </div>
                                    )}
                                  </div>

                                  {/* Action Buttons */}
                                  <div className="flex items-center gap-2">
                                    <Button
                                      size="sm"
                                      variant={task.completed ? "outline" : "default"}
                                      onClick={() => handleToggleTaskComplete(task.id, !task.completed, task.title)}
                                      className="flex-1 text-xs h-8"
                                    >
                                      {task.completed ? (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Reopen
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Complete
                                        </>
                                      )}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteTask(task.id, task.title)}
                                      className="text-xs h-8 px-3"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium mb-1">No tasks scheduled</p>
                            <p className="text-xs text-gray-400 mb-3">Add a task to get started</p>
                            <Button size="sm" onClick={onAddTaskClick} className="text-xs">
                              <Plus className="h-3 w-3 mr-1" />
                              Add Task
                            </Button>
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="events" className="space-y-3">
                        {isGoogleConnected ? (
                          getEventsForDate(selectedDate).googleEvents.length > 0 ? (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                              {getEventsForDate(selectedDate).googleEvents.map((event) => (
                                <Card key={event.id} className="border border-gray-200">
                                  <CardContent className="p-4">
                                    <div className="flex items-start gap-3">
                                      <span className="text-lg flex-shrink-0">{getTypeIcon(event.type)}</span>
                                      <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-sm text-gray-900 mb-1">{event.title}</h4>
                                        {event.time && (
                                          <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                                            <Clock className="h-3 w-3" />
                                            <span>{event.time}</span>
                                          </div>
                                        )}
                                        <Badge
                                          variant="outline"
                                          className="text-xs bg-purple-50 text-purple-700 border-purple-200"
                                        >
                                          Google Calendar
                                        </Badge>
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                              <p className="text-sm font-medium mb-1">No events for this day</p>
                              <p className="text-xs text-gray-400">Google Calendar events will appear here</p>
                            </div>
                          )
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <CalendarIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p className="text-sm font-medium mb-1">Connect Google Calendar</p>
                            <p className="text-xs text-gray-400 mb-3">Sync your events and reminders</p>
                            <Button size="sm" onClick={connectGoogleCalendar} className="text-xs">
                              Connect Now
                            </Button>
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="text-sm font-medium mb-1">Select a date</p>
                    <p className="text-xs text-gray-400">Click on any date to view tasks and events</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
