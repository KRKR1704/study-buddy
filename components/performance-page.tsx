"use client"

import { useState } from "react"
import { BarChart3, TrendingUp, Clock, Target, Brain, Trophy, Zap, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

interface DailyProductivity {
  date: string
  tasksCompleted: number
  totalTasks: number
  studyTime: number // in minutes
  quizScore: number | null
  focusScore: number // 1-10
  pomodoroSessions: number
  efficiency: number // percentage
}

interface WeeklyData {
  weekStart: string
  weekEnd: string
  days: DailyProductivity[]
  weeklyAverage: {
    completionRate: number
    studyTime: number
    focusScore: number
    efficiency: number
  }
}

interface PerformancePageProps {
  onBackToDashboard: () => void
}

export function PerformancePage({ onBackToDashboard }: PerformancePageProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState("4weeks")
  const [selectedMetric, setSelectedMetric] = useState("completion")

  // Replace the existing performanceData state and add more comprehensive data
  const [allPerformanceData] = useState<WeeklyData[]>([
    // Last 12 months of data (52 weeks) - I'll show a sample of key weeks
    // Week 1 (12 months ago)
    {
      weekStart: "2024-01-01",
      weekEnd: "2024-01-07",
      days: [
        {
          date: "2024-01-01",
          tasksCompleted: 5,
          totalTasks: 8,
          studyTime: 120,
          quizScore: 75,
          focusScore: 6,
          pomodoroSessions: 4,
          efficiency: 65,
        },
        {
          date: "2024-01-02",
          tasksCompleted: 7,
          totalTasks: 10,
          studyTime: 150,
          quizScore: 80,
          focusScore: 7,
          pomodoroSessions: 5,
          efficiency: 70,
        },
        {
          date: "2024-01-03",
          tasksCompleted: 6,
          totalTasks: 9,
          studyTime: 140,
          quizScore: 78,
          focusScore: 6,
          pomodoroSessions: 5,
          efficiency: 67,
        },
        {
          date: "2024-01-04",
          tasksCompleted: 8,
          totalTasks: 12,
          studyTime: 180,
          quizScore: 82,
          focusScore: 7,
          pomodoroSessions: 6,
          efficiency: 72,
        },
        {
          date: "2024-01-05",
          tasksCompleted: 9,
          totalTasks: 13,
          studyTime: 200,
          quizScore: 85,
          focusScore: 8,
          pomodoroSessions: 7,
          efficiency: 75,
        },
        {
          date: "2024-01-06",
          tasksCompleted: 4,
          totalTasks: 7,
          studyTime: 90,
          quizScore: null,
          focusScore: 5,
          pomodoroSessions: 3,
          efficiency: 60,
        },
        {
          date: "2024-01-07",
          tasksCompleted: 6,
          totalTasks: 9,
          studyTime: 130,
          quizScore: 77,
          focusScore: 6,
          pomodoroSessions: 4,
          efficiency: 68,
        },
      ],
      weeklyAverage: { completionRate: 69, studyTime: 144, focusScore: 6.4, efficiency: 68 },
    },
    // Add more weeks throughout the year with gradual improvement
    // Week 8 (10 months ago)
    {
      weekStart: "2024-02-19",
      weekEnd: "2024-02-25",
      days: [
        {
          date: "2024-02-19",
          tasksCompleted: 7,
          totalTasks: 10,
          studyTime: 160,
          quizScore: 78,
          focusScore: 7,
          pomodoroSessions: 5,
          efficiency: 70,
        },
        {
          date: "2024-02-20",
          tasksCompleted: 9,
          totalTasks: 12,
          studyTime: 190,
          quizScore: 83,
          focusScore: 8,
          pomodoroSessions: 6,
          efficiency: 75,
        },
        {
          date: "2024-02-21",
          tasksCompleted: 8,
          totalTasks: 11,
          studyTime: 170,
          quizScore: 80,
          focusScore: 7,
          pomodoroSessions: 6,
          efficiency: 73,
        },
        {
          date: "2024-02-22",
          tasksCompleted: 10,
          totalTasks: 14,
          studyTime: 220,
          quizScore: 86,
          focusScore: 8,
          pomodoroSessions: 8,
          efficiency: 78,
        },
        {
          date: "2024-02-23",
          tasksCompleted: 11,
          totalTasks: 15,
          studyTime: 240,
          quizScore: 88,
          focusScore: 8,
          pomodoroSessions: 9,
          efficiency: 80,
        },
        {
          date: "2024-02-24",
          tasksCompleted: 6,
          totalTasks: 9,
          studyTime: 120,
          quizScore: null,
          focusScore: 6,
          pomodoroSessions: 4,
          efficiency: 67,
        },
        {
          date: "2024-02-25",
          tasksCompleted: 8,
          totalTasks: 11,
          studyTime: 160,
          quizScore: 81,
          focusScore: 7,
          pomodoroSessions: 5,
          efficiency: 73,
        },
      ],
      weeklyAverage: { completionRate: 73, studyTime: 180, focusScore: 7.3, efficiency: 74 },
    },
    // Week 20 (6 months ago)
    {
      weekStart: "2024-05-13",
      weekEnd: "2024-05-19",
      days: [
        {
          date: "2024-05-13",
          tasksCompleted: 9,
          totalTasks: 12,
          studyTime: 200,
          quizScore: 82,
          focusScore: 8,
          pomodoroSessions: 7,
          efficiency: 75,
        },
        {
          date: "2024-05-14",
          tasksCompleted: 11,
          totalTasks: 14,
          studyTime: 230,
          quizScore: 87,
          focusScore: 8,
          pomodoroSessions: 8,
          efficiency: 79,
        },
        {
          date: "2024-05-15",
          tasksCompleted: 10,
          totalTasks: 13,
          studyTime: 210,
          quizScore: 84,
          focusScore: 8,
          pomodoroSessions: 7,
          efficiency: 77,
        },
        {
          date: "2024-05-16",
          tasksCompleted: 12,
          totalTasks: 15,
          studyTime: 250,
          quizScore: 89,
          focusScore: 9,
          pomodoroSessions: 9,
          efficiency: 80,
        },
        {
          date: "2024-05-17",
          tasksCompleted: 13,
          totalTasks: 16,
          studyTime: 270,
          quizScore: 91,
          focusScore: 9,
          pomodoroSessions: 10,
          efficiency: 81,
        },
        {
          date: "2024-05-18",
          tasksCompleted: 7,
          totalTasks: 10,
          studyTime: 140,
          quizScore: null,
          focusScore: 7,
          pomodoroSessions: 5,
          efficiency: 70,
        },
        {
          date: "2024-05-19",
          tasksCompleted: 9,
          totalTasks: 12,
          studyTime: 180,
          quizScore: 85,
          focusScore: 8,
          pomodoroSessions: 6,
          efficiency: 75,
        },
      ],
      weeklyAverage: { completionRate: 78, studyTime: 211, focusScore: 8.1, efficiency: 77 },
    },
    // Week 44 (1 month ago)
    {
      weekStart: "2024-11-04",
      weekEnd: "2024-11-10",
      days: [
        {
          date: "2024-11-04",
          tasksCompleted: 10,
          totalTasks: 12,
          studyTime: 220,
          quizScore: 87,
          focusScore: 8,
          pomodoroSessions: 8,
          efficiency: 83,
        },
        {
          date: "2024-11-05",
          tasksCompleted: 12,
          totalTasks: 14,
          studyTime: 250,
          quizScore: 90,
          focusScore: 9,
          pomodoroSessions: 9,
          efficiency: 86,
        },
        {
          date: "2024-11-06",
          tasksCompleted: 11,
          totalTasks: 13,
          studyTime: 230,
          quizScore: 88,
          focusScore: 8,
          pomodoroSessions: 8,
          efficiency: 85,
        },
        {
          date: "2024-11-07",
          tasksCompleted: 14,
          totalTasks: 16,
          studyTime: 280,
          quizScore: 92,
          focusScore: 9,
          pomodoroSessions: 10,
          efficiency: 88,
        },
        {
          date: "2024-11-08",
          tasksCompleted: 13,
          totalTasks: 15,
          studyTime: 260,
          quizScore: 89,
          focusScore: 9,
          pomodoroSessions: 9,
          efficiency: 87,
        },
        {
          date: "2024-11-09",
          tasksCompleted: 8,
          totalTasks: 11,
          studyTime: 160,
          quizScore: null,
          focusScore: 7,
          pomodoroSessions: 6,
          efficiency: 73,
        },
        {
          date: "2024-11-10",
          tasksCompleted: 10,
          totalTasks: 12,
          studyTime: 200,
          quizScore: 86,
          focusScore: 8,
          pomodoroSessions: 7,
          efficiency: 83,
        },
      ],
      weeklyAverage: { completionRate: 84, studyTime: 229, focusScore: 8.3, efficiency: 84 },
    },
    // Current weeks (last 4 weeks) - keep existing data
    {
      weekStart: "2024-12-02",
      weekEnd: "2024-12-08",
      days: [
        {
          date: "2024-12-02",
          tasksCompleted: 8,
          totalTasks: 10,
          studyTime: 180,
          quizScore: 85,
          focusScore: 8,
          pomodoroSessions: 6,
          efficiency: 80,
        },
        {
          date: "2024-12-03",
          tasksCompleted: 12,
          totalTasks: 15,
          studyTime: 240,
          quizScore: 92,
          focusScore: 9,
          pomodoroSessions: 8,
          efficiency: 85,
        },
        {
          date: "2024-12-04",
          tasksCompleted: 6,
          totalTasks: 8,
          studyTime: 120,
          quizScore: 78,
          focusScore: 7,
          pomodoroSessions: 4,
          efficiency: 75,
        },
        {
          date: "2024-12-05",
          tasksCompleted: 15,
          totalTasks: 18,
          studyTime: 300,
          quizScore: 88,
          focusScore: 9,
          pomodoroSessions: 10,
          efficiency: 90,
        },
        {
          date: "2024-12-06",
          tasksCompleted: 10,
          totalTasks: 12,
          studyTime: 200,
          quizScore: 95,
          focusScore: 8,
          pomodoroSessions: 7,
          efficiency: 83,
        },
        {
          date: "2024-12-07",
          tasksCompleted: 5,
          totalTasks: 8,
          studyTime: 90,
          quizScore: null,
          focusScore: 6,
          pomodoroSessions: 3,
          efficiency: 62,
        },
        {
          date: "2024-12-08",
          tasksCompleted: 8,
          totalTasks: 10,
          studyTime: 150,
          quizScore: 82,
          focusScore: 7,
          pomodoroSessions: 5,
          efficiency: 80,
        },
      ],
      weeklyAverage: { completionRate: 80, studyTime: 183, focusScore: 7.7, efficiency: 79 },
    },
    {
      weekStart: "2024-12-09",
      weekEnd: "2024-12-15",
      days: [
        {
          date: "2024-12-09",
          tasksCompleted: 9,
          totalTasks: 11,
          studyTime: 210,
          quizScore: 90,
          focusScore: 8,
          pomodoroSessions: 7,
          efficiency: 82,
        },
        {
          date: "2024-12-10",
          tasksCompleted: 14,
          totalTasks: 16,
          studyTime: 270,
          quizScore: 87,
          focusScore: 9,
          pomodoroSessions: 9,
          efficiency: 88,
        },
        {
          date: "2024-12-11",
          tasksCompleted: 7,
          totalTasks: 9,
          studyTime: 140,
          quizScore: 93,
          focusScore: 8,
          pomodoroSessions: 5,
          efficiency: 78,
        },
        {
          date: "2024-12-12",
          tasksCompleted: 16,
          totalTasks: 18,
          studyTime: 320,
          quizScore: 85,
          focusScore: 9,
          pomodoroSessions: 11,
          efficiency: 89,
        },
        {
          date: "2024-12-13",
          tasksCompleted: 11,
          totalTasks: 13,
          studyTime: 220,
          quizScore: 91,
          focusScore: 8,
          pomodoroSessions: 8,
          efficiency: 85,
        },
        {
          date: "2024-12-14",
          tasksCompleted: 6,
          totalTasks: 9,
          studyTime: 110,
          quizScore: null,
          focusScore: 7,
          pomodoroSessions: 4,
          efficiency: 67,
        },
        {
          date: "2024-12-15",
          tasksCompleted: 9,
          totalTasks: 11,
          studyTime: 180,
          quizScore: 88,
          focusScore: 8,
          pomodoroSessions: 6,
          efficiency: 82,
        },
      ],
      weeklyAverage: { completionRate: 82, studyTime: 207, focusScore: 8.1, efficiency: 82 },
    },
    {
      weekStart: "2024-12-16",
      weekEnd: "2024-12-22",
      days: [
        {
          date: "2024-12-16",
          tasksCompleted: 10,
          totalTasks: 12,
          studyTime: 230,
          quizScore: 92,
          focusScore: 9,
          pomodoroSessions: 8,
          efficiency: 83,
        },
        {
          date: "2024-12-17",
          tasksCompleted: 13,
          totalTasks: 15,
          studyTime: 280,
          quizScore: 89,
          focusScore: 8,
          pomodoroSessions: 10,
          efficiency: 87,
        },
        {
          date: "2024-12-18",
          tasksCompleted: 8,
          totalTasks: 10,
          studyTime: 160,
          quizScore: 95,
          focusScore: 9,
          pomodoroSessions: 6,
          efficiency: 80,
        },
        {
          date: "2024-12-19",
          tasksCompleted: 17,
          totalTasks: 19,
          studyTime: 340,
          quizScore: 87,
          focusScore: 9,
          pomodoroSessions: 12,
          efficiency: 89,
        },
        {
          date: "2024-12-20",
          tasksCompleted: 12,
          totalTasks: 14,
          studyTime: 250,
          quizScore: 93,
          focusScore: 8,
          pomodoroSessions: 9,
          efficiency: 86,
        },
        {
          date: "2024-12-21",
          tasksCompleted: 7,
          totalTasks: 10,
          studyTime: 130,
          quizScore: null,
          focusScore: 7,
          pomodoroSessions: 5,
          efficiency: 70,
        },
        {
          date: "2024-12-22",
          tasksCompleted: 10,
          totalTasks: 12,
          studyTime: 200,
          quizScore: 90,
          focusScore: 8,
          pomodoroSessions: 7,
          efficiency: 83,
        },
      ],
      weeklyAverage: { completionRate: 84, studyTime: 227, focusScore: 8.3, efficiency: 83 },
    },
    {
      weekStart: "2024-12-23",
      weekEnd: "2024-12-29",
      days: [
        {
          date: "2024-12-23",
          tasksCompleted: 11,
          totalTasks: 13,
          studyTime: 240,
          quizScore: 88,
          focusScore: 8,
          pomodoroSessions: 8,
          efficiency: 85,
        },
        {
          date: "2024-12-24",
          tasksCompleted: 5,
          totalTasks: 8,
          studyTime: 90,
          quizScore: null,
          focusScore: 6,
          pomodoroSessions: 3,
          efficiency: 62,
        },
        {
          date: "2024-12-25",
          tasksCompleted: 3,
          totalTasks: 5,
          studyTime: 60,
          quizScore: null,
          focusScore: 5,
          pomodoroSessions: 2,
          efficiency: 60,
        },
        {
          date: "2024-12-26",
          tasksCompleted: 8,
          totalTasks: 10,
          studyTime: 180,
          quizScore: 85,
          focusScore: 7,
          pomodoroSessions: 6,
          efficiency: 80,
        },
        {
          date: "2024-12-27",
          tasksCompleted: 14,
          totalTasks: 16,
          studyTime: 290,
          quizScore: 92,
          focusScore: 9,
          pomodoroSessions: 10,
          efficiency: 88,
        },
        {
          date: "2024-12-28",
          tasksCompleted: 9,
          totalTasks: 12,
          studyTime: 200,
          quizScore: 87,
          focusScore: 8,
          pomodoroSessions: 7,
          efficiency: 75,
        },
        {
          date: "2024-12-29",
          tasksCompleted: 12,
          totalTasks: 15,
          studyTime: 260,
          quizScore: 90,
          focusScore: 8,
          pomodoroSessions: 9,
          efficiency: 80,
        },
      ],
      weeklyAverage: { completionRate: 75, studyTime: 189, focusScore: 7.3, efficiency: 76 },
    },
  ])

  const getFilteredData = () => {
    const now = new Date()
    let startDate: Date

    switch (selectedTimeframe) {
      case "1week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case "4weeks":
        startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
        break
      case "3months":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        break
      case "6months":
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
        break
      case "1year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
        break
      default:
        startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)
    }

    return allPerformanceData.filter((week) => {
      const weekStartDate = new Date(week.weekStart)
      return weekStartDate >= startDate
    })
  }

  const performanceData = getFilteredData()

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getDayName = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { weekday: "short" })
  }

  const getMetricValue = (day: DailyProductivity, metric: string) => {
    switch (metric) {
      case "completion":
        return (day.tasksCompleted / day.totalTasks) * 100
      case "studyTime":
        return day.studyTime
      case "focusScore":
        return day.focusScore * 10
      case "efficiency":
        return day.efficiency
      case "pomodoro":
        return day.pomodoroSessions * 10
      default:
        return 0
    }
  }

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case "completion":
        return "Task Completion %"
      case "studyTime":
        return "Study Time (min)"
      case "focusScore":
        return "Focus Score"
      case "efficiency":
        return "Efficiency %"
      case "pomodoro":
        return "Pomodoro Sessions"
      default:
        return ""
    }
  }

  const getMetricColor = (metric: string) => {
    switch (metric) {
      case "completion":
        return "bg-blue-500"
      case "studyTime":
        return "bg-green-500"
      case "focusScore":
        return "bg-purple-500"
      case "efficiency":
        return "bg-orange-500"
      case "pomodoro":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const calculateTrend = (metric: string) => {
    const filteredData = getFilteredData()
    if (filteredData.length < 2) return { trend: "neutral", change: 0 }

    const latest = filteredData[filteredData.length - 1].weeklyAverage
    const previous = filteredData[filteredData.length - 2].weeklyAverage

    let latestValue, previousValue

    switch (metric) {
      case "completion":
        latestValue = latest.completionRate
        previousValue = previous.completionRate
        break
      case "studyTime":
        latestValue = latest.studyTime
        previousValue = previous.studyTime
        break
      case "focusScore":
        latestValue = latest.focusScore
        previousValue = previous.focusScore
        break
      case "efficiency":
        latestValue = latest.efficiency
        previousValue = previous.efficiency
        break
      default:
        return { trend: "neutral", change: 0 }
    }

    if (previousValue === 0) return { trend: "neutral", change: 0 }

    const change = ((latestValue - previousValue) / previousValue) * 100
    const trend = change > 2 ? "up" : change < -2 ? "down" : "neutral"

    return { trend, change: Math.abs(change) }
  }

  const getOverallStats = () => {
    const filteredData = getFilteredData()
    const allDays = filteredData.flatMap((week) => week.days)

    // Handle empty data case
    if (allDays.length === 0) {
      return {
        completionRate: 0,
        totalStudyTime: 0,
        avgFocusScore: 0,
        totalPomodoros: 0,
        avgQuizScore: 0,
        studyStreak: 0,
        bestDay: {
          date: new Date().toISOString().split("T")[0],
          tasksCompleted: 0,
          totalTasks: 1,
          studyTime: 0,
          quizScore: null,
          focusScore: 0,
          pomodoroSessions: 0,
          efficiency: 0,
        },
      }
    }

    const totalTasks = allDays.reduce((sum, day) => sum + day.totalTasks, 0)
    const completedTasks = allDays.reduce((sum, day) => sum + day.tasksCompleted, 0)
    const totalStudyTime = allDays.reduce((sum, day) => sum + day.studyTime, 0)
    const avgFocusScore = allDays.reduce((sum, day) => sum + day.focusScore, 0) / allDays.length
    const totalPomodoros = allDays.reduce((sum, day) => sum + day.pomodoroSessions, 0)
    const quizScores = allDays.filter((day) => day.quizScore !== null).map((day) => day.quizScore!)
    const avgQuizScore =
      quizScores.length > 0 ? quizScores.reduce((sum, score) => sum + score, 0) / quizScores.length : 0

    return {
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      totalStudyTime,
      avgFocusScore: Math.round(avgFocusScore * 10) / 10,
      totalPomodoros,
      avgQuizScore: Math.round(avgQuizScore),
      studyStreak: Math.min(allDays.length, 25), // Dynamic streak based on data
      bestDay: allDays.reduce((best, day) => {
        const currentRate = day.totalTasks > 0 ? day.tasksCompleted / day.totalTasks : 0
        const bestRate = best.totalTasks > 0 ? best.tasksCompleted / best.totalTasks : 0
        return currentRate > bestRate ? day : best
      }, allDays[0]),
    }
  }

  const stats = getOverallStats()

  return (
    <div className="flex-1 p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BarChart3 className="h-8 w-8" />
              Performance Analytics
            </h2>
            <p className="text-gray-600">Track your productivity, study patterns, and learning progress over time</p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1week">Last Week</SelectItem>
                <SelectItem value="4weeks">Last 4 Weeks</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last 1 Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={onBackToDashboard}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Overall Stats */}
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold text-gray-900">{stats.completionRate}%</p>
              <p className="text-xs text-gray-600">Task Completion</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="h-6 w-6 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold text-gray-900">{Math.round(stats.totalStudyTime / 60)}h</p>
              <p className="text-xs text-gray-600">Total Study Time</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Brain className="h-6 w-6 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold text-gray-900">{stats.avgFocusScore}/10</p>
              <p className="text-xs text-gray-600">Avg Focus Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Trophy className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold text-gray-900">{stats.avgQuizScore}%</p>
              <p className="text-xs text-gray-600">Avg Quiz Score</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="h-6 w-6 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold text-gray-900">{stats.totalPomodoros}</p>
              <p className="text-xs text-gray-600">Pomodoro Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-6 w-6 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold text-gray-900">{stats.studyStreak}</p>
              <p className="text-xs text-gray-600">Day Streak</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="productivity" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="productivity">Daily Productivity</TabsTrigger>
            <TabsTrigger value="trends">Weekly Trends</TabsTrigger>
            <TabsTrigger value="insights">Performance Insights</TabsTrigger>
            <TabsTrigger value="goals">Goals & Targets</TabsTrigger>
          </TabsList>

          <TabsContent value="productivity" className="space-y-6">
            {/* Metric Selector */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Daily Productivity Graph</h3>
                  <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select metric" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="completion">Task Completion Rate</SelectItem>
                      <SelectItem value="studyTime">Study Time</SelectItem>
                      <SelectItem value="focusScore">Focus Score</SelectItem>
                      <SelectItem value="efficiency">Efficiency</SelectItem>
                      <SelectItem value="pomodoro">Pomodoro Sessions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Weekly Productivity Charts */}
            <div className="space-y-6">
              {performanceData.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <div className="text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                      <p className="text-sm">No performance data found for the selected timeframe.</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                performanceData.map((week, weekIndex) => (
                  <Card key={weekIndex}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>
                          Week of {formatDate(week.weekStart)} - {formatDate(week.weekEnd)}
                        </span>
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700">
                            Avg:{" "}
                            {selectedMetric === "completion"
                              ? `${week.weeklyAverage.completionRate}%`
                              : selectedMetric === "studyTime"
                                ? formatTime(week.weeklyAverage.studyTime)
                                : selectedMetric === "focusScore"
                                  ? `${week.weeklyAverage.focusScore}/10`
                                  : selectedMetric === "efficiency"
                                    ? `${week.weeklyAverage.efficiency}%`
                                    : `${Math.round(week.days.reduce((sum, day) => sum + day.pomodoroSessions, 0) / 7)} sessions`}
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {/* Daily Bars Chart */}
                      <div className="space-y-4">
                        <div className="grid grid-cols-7 gap-2 h-64">
                          {week.days.map((day, dayIndex) => {
                            const value = getMetricValue(day, selectedMetric)
                            const maxValue = selectedMetric === "studyTime" ? 400 : 100
                            const height = (value / maxValue) * 100

                            return (
                              <div key={dayIndex} className="flex flex-col items-center">
                                <div className="flex-1 flex flex-col justify-end w-full">
                                  <div
                                    className={`${getMetricColor(selectedMetric)} rounded-t transition-all duration-300 hover:opacity-80 relative group`}
                                    style={{ height: `${Math.max(height, 5)}%` }}
                                  >
                                    {/* Tooltip */}
                                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                      {selectedMetric === "completion"
                                        ? `${Math.round(value)}%`
                                        : selectedMetric === "studyTime"
                                          ? formatTime(value)
                                          : selectedMetric === "focusScore"
                                            ? `${(value / 10).toFixed(1)}/10`
                                            : selectedMetric === "efficiency"
                                              ? `${Math.round(value)}%`
                                              : `${Math.round(value / 10)} sessions`}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-2 text-center">
                                  <p className="text-xs font-medium text-gray-900">{getDayName(day.date)}</p>
                                  <p className="text-xs text-gray-500">{formatDate(day.date)}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {/* Daily Details */}
                        <div className="grid grid-cols-7 gap-2 text-xs">
                          {week.days.map((day, dayIndex) => (
                            <div key={dayIndex} className="text-center space-y-1 p-2 bg-gray-50 rounded">
                              <div className="font-medium">
                                {day.tasksCompleted}/{day.totalTasks} tasks
                              </div>
                              <div className="text-gray-600">{formatTime(day.studyTime)}</div>
                              <div className="text-gray-600">Focus: {day.focusScore}/10</div>
                              {day.quizScore && <div className="text-green-600">Quiz: {day.quizScore}%</div>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            {/* Weekly Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["completion", "studyTime", "focusScore", "efficiency"].map((metric) => {
                const trend = calculateTrend(metric)
                return (
                  <Card key={metric}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{getMetricLabel(metric)}</span>
                        <div className="flex items-center gap-2">
                          {trend.trend === "up" ? (
                            <ArrowUp className="h-4 w-4 text-green-600" />
                          ) : trend.trend === "down" ? (
                            <ArrowDown className="h-4 w-4 text-red-600" />
                          ) : (
                            <div className="h-4 w-4" />
                          )}
                          <span
                            className={`text-sm ${
                              trend.trend === "up"
                                ? "text-green-600"
                                : trend.trend === "down"
                                  ? "text-red-600"
                                  : "text-gray-600"
                            }`}
                          >
                            {trend.change > 0 ? `${trend.change.toFixed(1)}%` : "No change"}
                          </span>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {performanceData.map((week, index) => {
                          let value
                          switch (metric) {
                            case "completion":
                              value = `${week.weeklyAverage.completionRate}%`
                              break
                            case "studyTime":
                              value = formatTime(week.weeklyAverage.studyTime)
                              break
                            case "focusScore":
                              value = `${week.weeklyAverage.focusScore}/10`
                              break
                            case "efficiency":
                              value = `${week.weeklyAverage.efficiency}%`
                              break
                            default:
                              value = "N/A"
                          }

                          return (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm text-gray-600">
                                Week {index + 1} ({formatDate(week.weekStart)})
                              </span>
                              <span className="font-medium">{value}</span>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            {/* Performance Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Best Performance Day</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">{formatDate(stats.bestDay.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tasks Completed:</span>
                      <span className="font-medium">
                        {stats.bestDay.tasksCompleted}/{stats.bestDay.totalTasks}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Completion Rate:</span>
                      <span className="font-medium text-green-600">
                        {Math.round((stats.bestDay.tasksCompleted / stats.bestDay.totalTasks) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Study Time:</span>
                      <span className="font-medium">{formatTime(stats.bestDay.studyTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Focus Score:</span>
                      <span className="font-medium">{stats.bestDay.focusScore}/10</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Study Patterns</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Most Productive Day:</span>
                      <span className="font-medium">Thursday</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Daily Study Time:</span>
                      <span className="font-medium">{formatTime(stats.totalStudyTime / 28)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Peak Performance Time:</span>
                      <span className="font-medium">2:00 PM - 4:00 PM</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Consistency Rating:</span>
                      <span className="font-medium text-blue-600">High</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Improvement Trend:</span>
                      <span className="font-medium text-green-600">Improving</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Weekly Comparison</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceData.slice(-2).map((week, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <h4 className="font-medium mb-2">{index === 0 ? "Previous Week" : "Current Week"}</h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Completion:</span>
                            <span className="ml-2 font-medium">{week.weeklyAverage.completionRate}%</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Study Time:</span>
                            <span className="ml-2 font-medium">{formatTime(week.weeklyAverage.studyTime)}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Focus:</span>
                            <span className="ml-2 font-medium">{week.weeklyAverage.focusScore}/10</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Efficiency:</span>
                            <span className="ml-2 font-medium">{week.weeklyAverage.efficiency}%</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-1">📈 Productivity Tip</h4>
                      <p className="text-sm text-blue-800">
                        Your best performance is on Thursdays. Try scheduling important tasks on this day.
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-1">⏰ Time Management</h4>
                      <p className="text-sm text-green-800">
                        You're most focused between 2-4 PM. Consider blocking this time for deep work.
                      </p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-lg">
                      <h4 className="font-medium text-purple-900 mb-1">🎯 Focus Improvement</h4>
                      <p className="text-sm text-purple-800">
                        Try increasing Pomodoro sessions on low-focus days to improve concentration.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="goals" className="space-y-6">
            {/* Goals and Targets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Weekly Goals</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Task Completion Rate</span>
                        <span className="text-sm text-gray-600">85% / 90%</span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Study Time</span>
                        <span className="text-sm text-gray-600">25h / 30h</span>
                      </div>
                      <Progress value={83} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Focus Score</span>
                        <span className="text-sm text-gray-600">8.2 / 9.0</span>
                      </div>
                      <Progress value={91} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Pomodoro Sessions</span>
                        <span className="text-sm text-gray-600">45 / 50</span>
                      </div>
                      <Progress value={90} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Monthly Targets</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Study Streak</span>
                        <span className="text-sm text-gray-600">12 / 20 days</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Quiz Average</span>
                        <span className="text-sm text-gray-600">89% / 95%</span>
                      </div>
                      <Progress value={94} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Documents Processed</span>
                        <span className="text-sm text-gray-600">8 / 15</span>
                      </div>
                      <Progress value={53} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Total Study Hours</span>
                        <span className="text-sm text-gray-600">95h / 120h</span>
                      </div>
                      <Progress value={79} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievement Badges */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-3xl mb-2">🏆</div>
                    <h4 className="font-medium text-sm">Perfect Week</h4>
                    <p className="text-xs text-gray-600">100% task completion</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl mb-2">📚</div>
                    <h4 className="font-medium text-sm">Study Master</h4>
                    <p className="text-xs text-gray-600">50+ hours this month</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl mb-2">🎯</div>
                    <h4 className="font-medium text-sm">Focus Champion</h4>
                    <p className="text-xs text-gray-600">9+ focus score streak</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl mb-2">⚡</div>
                    <h4 className="font-medium text-sm">Efficiency Expert</h4>
                    <p className="text-xs text-gray-600">85%+ efficiency rate</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
