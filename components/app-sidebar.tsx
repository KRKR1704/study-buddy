"use client"

import type React from "react"

import { Calendar, FileText, HelpCircle, Upload, Timer, History, BarChart3, Plus, Home } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

const menuItems = [
  {
    title: "Dashboard",
    icon: Home,
    action: "dashboard",
  },
  {
    title: "Add Task",
    icon: Plus,
    action: "add-task",
  },
  {
    title: "Calendar",
    icon: Calendar,
    action: "calendar",
  },
  {
    title: "Summarize",
    icon: FileText,
    action: "summarize",
  },
  {
    title: "Quiz",
    icon: HelpCircle,
    action: "quiz",
  },
  {
    title: "Uploads",
    icon: Upload,
    action: "uploads",
  },
  {
    title: "Pomodoro Timer",
    icon: Timer,
    action: "pomodoro",
  },
  {
    title: "History",
    icon: History,
    action: "history",
  },
  {
    title: "Performance",
    icon: BarChart3,
    action: "performance",
  },
]

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  onAddTaskClick: () => void
  onCalendarClick: () => void
  onSummarizeClick: () => void
  onQuizClick: () => void
  onUploadsClick: () => void
  onPomodoroClick: () => void
  onHistoryClick: () => void
  onPerformanceClick: () => void
  currentPage: string
  onNavigate: (
    page: "dashboard" | "calendar" | "summarize" | "quiz" | "uploads" | "pomodoro" | "history" | "performance",
  ) => void
}

export function AppSidebar({
  onAddTaskClick,
  onCalendarClick,
  onSummarizeClick,
  onQuizClick,
  onUploadsClick,
  onPomodoroClick,
  onHistoryClick,
  onPerformanceClick,
  currentPage,
  onNavigate,
  ...props
}: AppSidebarProps) {
  const handleMenuClick = (item: (typeof menuItems)[0]) => {
    if (item.action === "add-task") {
      onAddTaskClick()
    } else if (item.action === "calendar") {
      onNavigate("calendar")
    } else if (item.action === "dashboard") {
      onNavigate("dashboard")
    } else if (item.action === "summarize") {
      onNavigate("summarize")
    } else if (item.action === "quiz") {
      onNavigate("quiz")
    } else if (item.action === "uploads") {
      onNavigate("uploads")
    } else if (item.action === "pomodoro") {
      onNavigate("pomodoro")
    } else if (item.action === "history") {
      onNavigate("history")
    } else if (item.action === "performance") {
      onNavigate("performance")
    }
    // Handle other menu items with URLs normally
  }

  return (
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Study Tools</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild={!item.action}
                    onClick={item.action ? () => handleMenuClick(item) : undefined}
                    isActive={
                      (item.action === "dashboard" && currentPage === "dashboard") ||
                      (item.action === "calendar" && currentPage === "calendar") ||
                      (item.action === "summarize" && currentPage === "summarize") ||
                      (item.action === "quiz" && currentPage === "quiz") ||
                      (item.action === "uploads" && currentPage === "uploads") ||
                      (item.action === "pomodoro" && currentPage === "pomodoro") ||
                      (item.action === "history" && currentPage === "history") ||
                      (item.action === "performance" && currentPage === "performance")
                    }
                  >
                    {item.action ? (
                      <div className="flex items-center gap-2 w-full cursor-pointer">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </div>
                    ) : (
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
