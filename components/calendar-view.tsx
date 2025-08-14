"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, Clock, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface CalendarViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAddTaskClick: () => void
}

interface Task {
  id: string
  title: string
  date: string
  time?: string
  type: "assignment" | "exam" | "project" | "reading" | "practice" | "research"
  priority: "low" | "medium" | "high" | "urgent"
  hoursPerDay: number
  isGoogleEvent?: boolean
}

interface GoogleEvent {
  id: string
  title: string
  date: string
  time?: string
  type: "reminder" | "meeting" | "event"
}

export function CalendarView({ open, onOpenChange, onAddTaskClick }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [isGoogleConnected, setIsGoogleConnected] = useState(false)

  // Sample tasks data - in real app, this would come from your database
  const [tasks] = useState<Task[]>([
    {
      id: "1",
      title: "Math Assignment",
      date: "2024-12-26",
      time: "23:59",
      type: "assignment",
      priority: "urgent",
      hoursPerDay: 2,
    },
    {
      id: "2",
      title: "History Essay",
      date: "2024-12-28",
      time: "15:00",
      type: "assignment",
      priority: "high",
      hoursPerDay: 1.5,
    },
    {
      id: "3",
      title: "Science Project",
      date: "2024-12-31",
      type: "project",
      priority: "medium",
      hoursPerDay: 3,
    },
    {
      id: "4",
      title: "Final Exam Prep",
      date: "2025-01-02",
      type: "exam",
      priority: "high",
      hoursPerDay: 4,
    },
  ])

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
    alert("Google Calendar connected successfully! (Demo)")
  }

  const days = getDaysInMonth(currentDate)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Study Calendar
            </div>
            <div className="flex items-center gap-2">
              {!isGoogleConnected && (
                <Button variant="outline" size="sm" onClick={connectGoogleCalendar}>
                  Connect Google Calendar
                </Button>
              )}
              {isGoogleConnected && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Google Calendar Connected
                </Badge>
              )}
              <Button size="sm" onClick={onAddTaskClick}>
                <Plus className="h-4 w-4 mr-1" />
                Add Task
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row gap-6 h-[calc(90vh-120px)]">
          {/* Calendar Grid */}
          <div className="flex-1">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
              <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h2 className="text-xl font-semibold">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {daysOfWeek.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            <div className="grid grid-cols-7 gap-1 flex-1">
              {days.map((day, index) => {
                if (!day) {
                  return <div key={index} className="p-1 h-24" />
                }

                const { tasks: dayTasks, googleEvents: dayGoogleEvents } = getEventsForDate(day)
                const isToday = day.toDateString() === new Date().toDateString()
                const isSelected = selectedDate?.toDateString() === day.toDateString()

                return (
                  <div
                    key={index}
                    className={`p-1 h-24 border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors ${
                      isToday ? "bg-blue-50 border-blue-300" : ""
                    } ${isSelected ? "bg-blue-100 border-blue-400" : ""}`}
                    onClick={() => setSelectedDate(day)}
                  >
                    <div className="h-full flex flex-col">
                      <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-600" : ""}`}>
                        {day.getDate()}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        {dayTasks.slice(0, 2).map((task) => (
                          <div
                            key={task.id}
                            className={`text-xs p-1 mb-1 rounded text-white truncate ${getPriorityColor(task.priority)}`}
                            title={task.title}
                          >
                            {getTypeIcon(task.type)} {task.title}
                          </div>
                        ))}
                        {dayGoogleEvents.slice(0, 1).map((event) => (
                          <div
                            key={event.id}
                            className="text-xs p-1 mb-1 rounded bg-purple-500 text-white truncate"
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

          {/* Side Panel */}
          <div className="w-full lg:w-80 border-l pl-6">
            {selectedDate ? (
              <div>
                <h3 className="text-lg font-semibold mb-4">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>

                <Tabs defaultValue="tasks" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="tasks">Study Tasks</TabsTrigger>
                    <TabsTrigger value="events">Calendar Events</TabsTrigger>
                  </TabsList>

                  <TabsContent value="tasks" className="space-y-3">
                    {getEventsForDate(selectedDate).tasks.length > 0 ? (
                      getEventsForDate(selectedDate).tasks.map((task) => (
                        <Card key={task.id}>
                          <CardContent className="p-3">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span>{getTypeIcon(task.type)}</span>
                                  <h4 className="font-medium text-sm">{task.title}</h4>
                                </div>
                                <div className="space-y-1">
                                  {task.time && (
                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                      <Clock className="h-3 w-3" />
                                      {task.time}
                                    </div>
                                  )}
                                  <div className="flex items-center gap-1 text-xs text-gray-600">
                                    <AlertCircle className="h-3 w-3" />
                                    {task.hoursPerDay}h per day
                                  </div>
                                </div>
                              </div>
                              <Badge
                                variant="secondary"
                                className={`${getPriorityColor(task.priority)} text-white text-xs`}
                              >
                                {task.priority}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No tasks scheduled for this day</p>
                        <Button size="sm" className="mt-2" onClick={onAddTaskClick}>
                          Add Task
                        </Button>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="events" className="space-y-3">
                    {isGoogleConnected ? (
                      getEventsForDate(selectedDate).googleEvents.length > 0 ? (
                        getEventsForDate(selectedDate).googleEvents.map((event) => (
                          <Card key={event.id}>
                            <CardContent className="p-3">
                              <div className="flex items-start gap-2">
                                <span>{getTypeIcon(event.type)}</span>
                                <div className="flex-1">
                                  <h4 className="font-medium text-sm">{event.title}</h4>
                                  {event.time && (
                                    <div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
                                      <Clock className="h-3 w-3" />
                                      {event.time}
                                    </div>
                                  )}
                                  <Badge variant="outline" className="mt-1 text-xs">
                                    Google Calendar
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>No Google Calendar events for this day</p>
                        </div>
                      )
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>Connect Google Calendar to see your events</p>
                        <Button size="sm" className="mt-2" onClick={connectGoogleCalendar}>
                          Connect Now
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <CalendarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Select a date to view details</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
