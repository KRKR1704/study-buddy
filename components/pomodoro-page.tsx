"use client"

import { useState, useEffect, useRef } from "react"
import { Play, Settings, RotateCcw, Coffee, Brain, Volume2, VolumeX, Shield, CheckSquare, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useTasks } from "../contexts/task-context"

interface PomodoroPageProps {
  onBackToDashboard: () => void
  isAdmin?: boolean // Admin prop to show stop button
}

type TimerPhase = "work" | "shortBreak" | "longBreak" | "idle"

interface PomodoroSettings {
  workDuration: number // in minutes
  shortBreakDuration: number
  longBreakDuration: number
  longBreakInterval: number // after how many work sessions
  autoStartBreaks: boolean
  autoStartWork: boolean
  soundEnabled: boolean
  soundVolume: number
  notifications: boolean
}

interface PomodoroSession {
  id: string
  taskId: string | null
  taskTitle: string
  phase: TimerPhase
  duration: number // in seconds
  completedAt: string
  workTimeSpent: number // actual work time in seconds
}

export function PomodoroPage({ onBackToDashboard, isAdmin = false }: PomodoroPageProps) {
  const { toast } = useToast()
  const { tasks, updateTask } = useTasks()
  const [isRunning, setIsRunning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(25 * 60) // 25 minutes in seconds
  const [currentPhase, setCurrentPhase] = useState<TimerPhase>("idle")
  const [completedSessions, setCompletedSessions] = useState(0)
  const [totalWorkTime, setTotalWorkTime] = useState(0) // in seconds
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [taskSelectionOpen, setTaskSelectionOpen] = useState(false)
  const [showAdminPanel, setShowAdminPanel] = useState(false)
  const [adminPassword, setAdminPassword] = useState("")
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)

  // Task-related state
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [selectedTaskTitle, setSelectedTaskTitle] = useState("No task selected")
  const [sessionHistory, setSessionHistory] = useState<PomodoroSession[]>([])
  const [currentSessionStartTime, setCurrentSessionStartTime] = useState<number | null>(null)

  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [settings, setSettings] = useState<PomodoroSettings>({
    workDuration: 25,
    shortBreakDuration: 5,
    longBreakDuration: 15,
    longBreakInterval: 4,
    autoStartBreaks: false,
    autoStartWork: false,
    soundEnabled: true,
    soundVolume: 50,
    notifications: true,
  })

  // Get available tasks (incomplete tasks)
  const availableTasks = tasks.filter((task) => !task.completed)

  // Get today's tasks
  const todaysTasks = availableTasks.filter((task) => {
    const taskDate = new Date(task.date)
    const today = new Date()
    return taskDate.toDateString() === today.toDateString()
  })

  // Initialize audio
  useEffect(() => {
    audioRef.current = new Audio()
    audioRef.current.src =
      "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT"
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handlePhaseComplete()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeLeft])

  // Track work time
  useEffect(() => {
    if (isRunning && currentPhase === "work") {
      const workInterval = setInterval(() => {
        setTotalWorkTime((prev) => prev + 1)
      }, 1000)
      return () => clearInterval(workInterval)
    }
  }, [isRunning, currentPhase])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const formatWorkTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${mins}m`
    }
    return `${mins}m`
  }

  const playSound = () => {
    if (settings.soundEnabled && audioRef.current) {
      audioRef.current.volume = settings.soundVolume / 100
      audioRef.current.play().catch(() => {
        // Handle audio play failure silently
      })
    }
  }

  const showNotification = (title: string, body: string) => {
    if (settings.notifications && "Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" })
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((permission) => {
          if (permission === "granted") {
            new Notification(title, { body, icon: "/favicon.ico" })
          }
        })
      }
    }
  }

  const saveSession = (phase: TimerPhase, workTimeSpent: number) => {
    const session: PomodoroSession = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      taskId: selectedTaskId,
      taskTitle: selectedTaskTitle,
      phase,
      duration: getCurrentPhaseDuration() * 60,
      completedAt: new Date().toISOString(),
      workTimeSpent,
    }

    setSessionHistory((prev) => [...prev, session])

    // Update task progress if a task is selected
    if (selectedTaskId && phase === "work") {
      // You could add logic here to track time spent on specific tasks
      toast({
        title: "Progress Saved",
        description: `${formatWorkTime(workTimeSpent)} logged for "${selectedTaskTitle}"`,
      })
    }
  }

  const handlePhaseComplete = () => {
    setIsRunning(false)
    playSound()

    const workTimeSpent = currentSessionStartTime ? Date.now() - currentSessionStartTime : 0

    if (currentPhase === "work") {
      const newCompletedSessions = completedSessions + 1
      setCompletedSessions(newCompletedSessions)

      // Save the completed work session
      saveSession("work", Math.floor(workTimeSpent / 1000))

      // Determine next break type
      const isLongBreak = newCompletedSessions % settings.longBreakInterval === 0
      const nextPhase = isLongBreak ? "longBreak" : "shortBreak"
      const nextDuration = isLongBreak ? settings.longBreakDuration : settings.shortBreakDuration

      setCurrentPhase(nextPhase)
      setTimeLeft(nextDuration * 60)

      const breakType = isLongBreak ? "Long Break" : "Short Break"
      showNotification("Work Session Complete!", `Time for a ${breakType.toLowerCase()}!`)
      toast({
        title: "Work Session Complete! 🎉",
        description: `Great job working on "${selectedTaskTitle}"! Time for a ${breakType.toLowerCase()}.`,
      })

      if (settings.autoStartBreaks) {
        setTimeout(() => setIsRunning(true), 1000)
      }
    } else {
      // Break completed
      saveSession(currentPhase, 0)

      setCurrentPhase("work")
      setTimeLeft(settings.workDuration * 60)

      showNotification("Break Complete!", "Ready to get back to work?")
      toast({
        title: "Break Complete! ☕",
        description: "Ready to start your next work session?",
      })

      if (settings.autoStartWork) {
        setTimeout(() => setIsRunning(true), 1000)
      }
    }
  }

  const startTimer = () => {
    if (currentPhase === "idle") {
      // Check if a task is selected for work sessions
      if (!selectedTaskId) {
        setTaskSelectionOpen(true)
        return
      }
      setCurrentPhase("work")
      setTimeLeft(settings.workDuration * 60)
    }

    if (currentPhase === "work") {
      setCurrentSessionStartTime(Date.now())
    }

    setIsRunning(true)

    // Request notification permission
    if (settings.notifications && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }

  const resetTimer = () => {
    setIsRunning(false)
    setCurrentPhase("idle")
    setTimeLeft(settings.workDuration * 60)
    setCurrentSessionStartTime(null)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }

  const adminStop = () => {
    if (isAdminAuthenticated) {
      setIsRunning(false)
      setCurrentSessionStartTime(null)
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      toast({
        title: "Timer Stopped by Admin",
        description: "The Pomodoro timer has been stopped.",
        variant: "destructive",
      })
    }
  }

  const handleAdminAuth = () => {
    if (adminPassword === "admin123") {
      setIsAdminAuthenticated(true)
      setShowAdminPanel(false)
      setAdminPassword("")
      toast({
        title: "Admin Access Granted",
        description: "You now have admin controls.",
      })
    } else {
      toast({
        title: "Invalid Password",
        description: "Please enter the correct admin password.",
        variant: "destructive",
      })
    }
  }

  const updateSettings = (newSettings: Partial<PomodoroSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }))
    if (!isRunning && currentPhase === "idle") {
      setTimeLeft(newSettings.workDuration ? newSettings.workDuration * 60 : settings.workDuration * 60)
    }
  }

  const handleTaskSelection = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId)
    if (task) {
      setSelectedTaskId(taskId)
      setSelectedTaskTitle(task.title)
      setTaskSelectionOpen(false)
      toast({
        title: "Task Selected",
        description: `You'll be working on: "${task.title}"`,
      })
    }
  }

  const getPhaseColor = () => {
    switch (currentPhase) {
      case "work":
        return "text-red-600"
      case "shortBreak":
        return "text-green-600"
      case "longBreak":
        return "text-blue-600"
      default:
        return "text-gray-600"
    }
  }

  const getPhaseIcon = () => {
    switch (currentPhase) {
      case "work":
        return <Brain className="h-8 w-8 text-red-600" />
      case "shortBreak":
      case "longBreak":
        return <Coffee className="h-8 w-8 text-green-600" />
      default:
        return <Brain className="h-8 w-8 text-gray-600" />
    }
  }

  const getPhaseLabel = () => {
    switch (currentPhase) {
      case "work":
        return "Work Session"
      case "shortBreak":
        return "Short Break"
      case "longBreak":
        return "Long Break"
      default:
        return "Ready to Start"
    }
  }

  const progress =
    currentPhase !== "idle" ? ((getCurrentPhaseDuration() * 60 - timeLeft) / (getCurrentPhaseDuration() * 60)) * 100 : 0

  function getCurrentPhaseDuration() {
    switch (currentPhase) {
      case "work":
        return settings.workDuration
      case "shortBreak":
        return settings.shortBreakDuration
      case "longBreak":
        return settings.longBreakDuration
      default:
        return settings.workDuration
    }
  }

  const getTaskPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "text-red-600"
      case "high":
        return "text-orange-600"
      case "medium":
        return "text-yellow-600"
      case "low":
        return "text-green-600"
      default:
        return "text-gray-600"
    }
  }

  const getTaskTypeIcon = (type: string) => {
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
      default:
        return "📋"
    }
  }

  return (
    <div className="flex-1 p-6 bg-gradient-to-br from-red-50 to-orange-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Brain className="h-8 w-8" />
              Pomodoro Timer
            </h2>
            <p className="text-gray-600">Stay focused with the Pomodoro Technique</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => setShowAdminPanel(true)}
                className="text-purple-600 hover:text-purple-700"
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}
            <Button variant="outline" onClick={() => setSettingsOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" onClick={onBackToDashboard}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Current Task Display */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Current Task</p>
                  <p className="font-semibold text-gray-900">{selectedTaskTitle}</p>
                  {selectedTaskId && (
                    <div className="flex items-center gap-2 mt-1">
                      {(() => {
                        const task = tasks.find((t) => t.id === selectedTaskId)
                        return task ? (
                          <>
                            <span>{getTaskTypeIcon(task.type)}</span>
                            <Badge variant="outline" className={getTaskPriorityColor(task.priority)}>
                              {task.priority.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-gray-500">{task.hoursPerDay}h/day planned</span>
                          </>
                        ) : null
                      })()}
                    </div>
                  )}
                </div>
              </div>
              <Button variant="outline" onClick={() => setTaskSelectionOpen(true)} disabled={isRunning}>
                <Calendar className="h-4 w-4 mr-2" />
                {selectedTaskId ? "Change Task" : "Select Task"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Brain className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold text-gray-900">{completedSessions}</p>
              <p className="text-sm text-gray-600">Sessions Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Coffee className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor(completedSessions / settings.longBreakInterval)}
              </p>
              <p className="text-sm text-gray-600">Long Breaks Earned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="h-8 w-8 mx-auto mb-2 text-blue-600 text-2xl">⏱️</div>
              <p className="text-2xl font-bold text-gray-900">{formatWorkTime(totalWorkTime)}</p>
              <p className="text-sm text-gray-600">Total Work Time</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Timer */}
        <Card className="mb-8">
          <CardContent className="p-12 text-center">
            {/* Phase Indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-center gap-3 mb-2">
                {getPhaseIcon()}
                <Badge variant="outline" className={`text-lg px-4 py-2 ${getPhaseColor()}`}>
                  {getPhaseLabel()}
                </Badge>
              </div>
              {currentPhase !== "idle" && <Progress value={progress} className="w-64 mx-auto h-2" />}
            </div>

            {/* Timer Display */}
            <div className={`text-8xl font-bold mb-8 font-mono ${getPhaseColor()}`}>{formatTime(timeLeft)}</div>

            {/* Control Buttons */}
            <div className="flex items-center justify-center gap-4">
              {!isRunning ? (
                <Button
                  size="lg"
                  onClick={startTimer}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 text-lg"
                  disabled={currentPhase === "idle" && !selectedTaskId}
                >
                  <Play className="h-6 w-6 mr-2" />
                  {currentPhase === "idle" ? "Start Pomodoro" : "Resume"}
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-700 mb-2">
                    {currentPhase === "work" ? "Stay focused! 🎯" : "Enjoy your break! ☕"}
                  </p>
                  {currentPhase === "work" && selectedTaskId && (
                    <p className="text-sm text-blue-600 mb-4">Working on: {selectedTaskTitle}</p>
                  )}
                  <p className="text-sm text-gray-500">Timer is running - no distractions!</p>
                </div>
              )}

              {!isRunning && currentPhase !== "idle" && (
                <Button size="lg" variant="outline" onClick={resetTimer} className="px-8 py-4 text-lg">
                  <RotateCcw className="h-6 w-6 mr-2" />
                  Reset
                </Button>
              )}

              {/* Admin Stop Button */}
              {isRunning && isAdminAuthenticated && (
                <Button size="lg" variant="destructive" onClick={adminStop} className="px-8 py-4 text-lg">
                  <Shield className="h-6 w-6 mr-2" />
                  Admin Stop
                </Button>
              )}
            </div>

            {/* Task Selection Warning */}
            {currentPhase === "idle" && !selectedTaskId && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  Please select a task from your calendar before starting a work session.
                </p>
              </div>
            )}

            {/* Next Phase Info */}
            {isRunning && (
              <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  {currentPhase === "work"
                    ? `Next: ${completedSessions + 1 === settings.longBreakInterval ? "Long Break" : "Short Break"} (${
                        completedSessions + 1 === settings.longBreakInterval
                          ? settings.longBreakDuration
                          : settings.shortBreakDuration
                      } min)`
                    : `Next: Work Session (${settings.workDuration} min)`}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Session Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Session Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              {Array.from({ length: settings.longBreakInterval }, (_, i) => (
                <div
                  key={i}
                  className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                    i < completedSessions % settings.longBreakInterval
                      ? "bg-red-500 border-red-500 text-white"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  {i + 1}
                </div>
              ))}
              <div className="mx-4">
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center border-2 ${
                    completedSessions > 0 && completedSessions % settings.longBreakInterval === 0
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "bg-gray-100 border-gray-300 text-gray-400"
                  }`}
                >
                  <Coffee className="h-6 w-6" />
                </div>
              </div>
            </div>
            <p className="text-center text-sm text-gray-600 mt-4">
              Complete {settings.longBreakInterval} work sessions to earn a long break
            </p>
          </CardContent>
        </Card>

        {/* Task Selection Modal */}
        <Dialog open={taskSelectionOpen} onOpenChange={setTaskSelectionOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Select a Task to Work On</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {/* Today's Tasks */}
              {todaysTasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-blue-600">📅 Today's Tasks</h3>
                  <div className="space-y-2">
                    {todaysTasks.map((task) => (
                      <Card
                        key={task.id}
                        className="cursor-pointer hover:shadow-md transition-shadow border-blue-200"
                        onClick={() => handleTaskSelection(task.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className="text-lg">{getTaskTypeIcon(task.type)}</span>
                              <div>
                                <h4 className="font-medium">{task.title}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className={getTaskPriorityColor(task.priority)}>
                                    {task.priority.toUpperCase()}
                                  </Badge>
                                  <span className="text-sm text-gray-500">
                                    {task.hoursPerDay}h/day • Due: {task.time || "End of day"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button size="sm">Select</Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* All Other Tasks */}
              {availableTasks.filter((task) => !todaysTasks.includes(task)).length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-600">📋 All Tasks</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {availableTasks
                      .filter((task) => !todaysTasks.includes(task))
                      .map((task) => (
                        <Card
                          key={task.id}
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => handleTaskSelection(task.id)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="text-lg">{getTaskTypeIcon(task.type)}</span>
                                <div>
                                  <h4 className="font-medium">{task.title}</h4>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={getTaskPriorityColor(task.priority)}>
                                      {task.priority.toUpperCase()}
                                    </Badge>
                                    <span className="text-sm text-gray-500">
                                      Due: {new Date(task.date).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <Button size="sm" variant="outline">
                                Select
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                </div>
              )}

              {/* No Tasks Available */}
              {availableTasks.length === 0 && (
                <div className="text-center py-8">
                  <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Tasks Available</h3>
                  <p className="text-gray-600 mb-4">
                    You don't have any incomplete tasks. Add some tasks to your calendar first.
                  </p>
                  <Button variant="outline" onClick={() => setTaskSelectionOpen(false)}>
                    Close
                  </Button>
                </div>
              )}

              {/* Option to work without a specific task */}
              {availableTasks.length > 0 && (
                <div className="border-t pt-4">
                  <Card
                    className="cursor-pointer hover:shadow-md transition-shadow border-gray-200"
                    onClick={() => {
                      setSelectedTaskId(null)
                      setSelectedTaskTitle("General Study Session")
                      setTaskSelectionOpen(false)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">📚</span>
                          <div>
                            <h4 className="font-medium">General Study Session</h4>
                            <p className="text-sm text-gray-500">Work without a specific task</p>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          Select
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Modal */}
        <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Pomodoro Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              {/* Timer Durations */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Timer Durations</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="workDuration">Work Session (minutes)</Label>
                    <Input
                      id="workDuration"
                      type="number"
                      min="1"
                      max="60"
                      value={settings.workDuration}
                      onChange={(e) => updateSettings({ workDuration: Number.parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shortBreak">Short Break (minutes)</Label>
                    <Input
                      id="shortBreak"
                      type="number"
                      min="1"
                      max="30"
                      value={settings.shortBreakDuration}
                      onChange={(e) => updateSettings({ shortBreakDuration: Number.parseInt(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="longBreak">Long Break (minutes)</Label>
                    <Input
                      id="longBreak"
                      type="number"
                      min="1"
                      max="60"
                      value={settings.longBreakDuration}
                      onChange={(e) => updateSettings({ longBreakDuration: Number.parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="longBreakInterval">Long Break Interval (sessions)</Label>
                  <Input
                    id="longBreakInterval"
                    type="number"
                    min="2"
                    max="10"
                    value={settings.longBreakInterval}
                    onChange={(e) => updateSettings({ longBreakInterval: Number.parseInt(e.target.value) })}
                    className="w-32"
                  />
                  <p className="text-sm text-gray-500 mt-1">Number of work sessions before a long break</p>
                </div>
              </div>

              {/* Auto-start Options */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Auto-start Options</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoStartBreaks">Auto-start breaks</Label>
                    <Switch
                      id="autoStartBreaks"
                      checked={settings.autoStartBreaks}
                      onCheckedChange={(checked) => updateSettings({ autoStartBreaks: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="autoStartWork">Auto-start work sessions</Label>
                    <Switch
                      id="autoStartWork"
                      checked={settings.autoStartWork}
                      onCheckedChange={(checked) => updateSettings({ autoStartWork: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Sound Settings */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Sound & Notifications</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="soundEnabled">Enable sound alerts</Label>
                    <Switch
                      id="soundEnabled"
                      checked={settings.soundEnabled}
                      onCheckedChange={(checked) => updateSettings({ soundEnabled: checked })}
                    />
                  </div>
                  {settings.soundEnabled && (
                    <div>
                      <Label htmlFor="soundVolume">Sound Volume</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <VolumeX className="h-4 w-4" />
                        <Input
                          id="soundVolume"
                          type="range"
                          min="0"
                          max="100"
                          value={settings.soundVolume}
                          onChange={(e) => updateSettings({ soundVolume: Number.parseInt(e.target.value) })}
                          className="flex-1"
                        />
                        <Volume2 className="h-4 w-4" />
                        <span className="w-12 text-sm">{settings.soundVolume}%</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications">Browser notifications</Label>
                    <Switch
                      id="notifications"
                      checked={settings.notifications}
                      onCheckedChange={(checked) => updateSettings({ notifications: checked })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setSettingsOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Admin Panel Modal */}
        <Dialog open={showAdminPanel} onOpenChange={setShowAdminPanel}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Admin Access</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="adminPassword">Admin Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                  onKeyDown={(e) => e.key === "Enter" && handleAdminAuth()}
                />
                <p className="text-sm text-gray-500 mt-1">Default password: admin123</p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAdminPanel(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdminAuth}>Authenticate</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
