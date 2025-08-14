"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface Task {
  id: string
  title: string
  description?: string
  date: string
  time?: string
  type: "assignment" | "exam" | "project" | "reading" | "practice" | "research"
  priority: "low" | "medium" | "high" | "urgent"
  hoursPerDay: number
  completed: boolean
  createdAt: string
}

interface TaskContextType {
  tasks: Task[]
  addTask: (task: Omit<Task, "id" | "completed" | "createdAt">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  getTasksForDate: (date: string) => Task[]
}

const TaskContext = createContext<TaskContextType | undefined>(undefined)

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([
    // Sample tasks for demo
    {
      id: "1",
      title: "Math Assignment",
      date: "2024-12-26",
      time: "23:59",
      type: "assignment",
      priority: "urgent",
      hoursPerDay: 2,
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "2",
      title: "History Essay",
      date: "2024-12-28",
      time: "15:00",
      type: "assignment",
      priority: "high",
      hoursPerDay: 1.5,
      completed: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: "3",
      title: "Science Project",
      date: "2024-12-31",
      type: "project",
      priority: "medium",
      hoursPerDay: 3,
      completed: false,
      createdAt: new Date().toISOString(),
    },
  ])

  const addTask = (taskData: Omit<Task, "id" | "completed" | "createdAt">) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      completed: false,
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) => [...prev, newTask])
  }

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, ...updates } : task)))
  }

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id))
  }

  const getTasksForDate = (date: string) => {
    return tasks.filter((task) => task.date === date)
  }

  return (
    <TaskContext.Provider value={{ tasks, addTask, updateTask, deleteTask, getTasksForDate }}>
      {children}
    </TaskContext.Provider>
  )
}

export function useTasks() {
  const context = useContext(TaskContext)
  if (context === undefined) {
    throw new Error("useTasks must be used within a TaskProvider")
  }
  return context
}
