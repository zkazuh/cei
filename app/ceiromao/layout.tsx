"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu, Users, FileText, Calendar, BarChart3, LogOut } from "lucide-react"
import { logout } from "@/lib/auth"
import { useAuth } from "@/components/auth-provider"
import ProtectedLayout from "@/components/protected-layout"

const navigation = [
  { name: "Dashboard", href: "/ceiromao", icon: BarChart3 },
  { name: "Employees", href: "/ceiromao/employees", icon: Users },
  { name: "Teacher Files", href: "/ceiromao/teacher-files", icon: FileText },
  { name: "Attendance", href: "/ceiromao/attendance", icon: Calendar },
  { name: "Reports", href: "/ceiromao/reports", icon: BarChart3 },
]

export default function CeiromaoLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full ${mobile ? "w-full" : "w-64"}`}>
      <div className="flex items-center justify-center h-16 px-4 bg-blue-600 text-white">
        <h1 className="text-xl font-bold">CEIROMAO HR</h1>
      </div>
      <nav className="flex-1 px-4 py-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              onClick={() => mobile && setSidebarOpen(false)}
            >
              <Icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <p className="font-medium text-gray-900">{user?.email}</p>
            <p className="text-gray-500 capitalize">{user?.role}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )

  return (
    <ProtectedLayout>
      <div className="flex h-screen bg-gray-100">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64 bg-white border-r border-gray-200">
            <Sidebar />
          </div>
        </div>

        {/* Mobile Sidebar */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="sm" className="md:hidden fixed top-4 left-4 z-40">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar mobile />
          </SheetContent>
        </Sheet>

        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </ProtectedLayout>
  )
}
