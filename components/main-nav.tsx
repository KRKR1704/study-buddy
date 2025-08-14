"use client"
import { Menu, Upload, User, Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { useSidebar } from "@/components/ui/sidebar"
import { useTheme } from "../contexts/theme-context"

interface MainNavProps {
  onUploadClick: () => void
  onLogout: () => void
}

export function MainNav({ onUploadClick, onLogout }: MainNavProps) {
  const { toggleSidebar } = useSidebar()
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="flex items-center justify-between p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 transition-colors">
      {/* Left side - Hamburger menu and Logo */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">SB</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Study Buddy</h1>
        </div>
      </div>

      {/* Right side - Upload button and Profile */}
      <div className="flex items-center gap-3">
        <Button
          onClick={onUploadClick}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="theme-toggle" className="text-sm font-medium flex items-center gap-2">
                  {theme === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  Theme
                </Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Light</span>
                  <Switch id="theme-toggle" checked={theme === "dark"} onCheckedChange={toggleTheme} />
                  <span className="text-xs text-gray-500">Dark</span>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout}>Sign out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  )
}
