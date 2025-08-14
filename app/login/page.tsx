"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { signIn } from "@/lib/auth"
import { useAuth } from "@/components/auth-provider"
import { LogIn, Building2 } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { setUser } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const user = await signIn(email, password)
      if (user) {
        localStorage.setItem("user", JSON.stringify(user))
        setUser(user)
        toast({
          title: "Success",
          description: "Logged in successfully",
        })
        router.push("/ceiromao")
      } else {
        toast({
          title: "Error",
          description: "Invalid email or password",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An error occurred during login",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const demoCredentials = [
    { email: "admin@ceiromao.com", password: "admin123", role: "Admin" },
    { email: "employee@ceiromao.com", password: "emp123", role: "Employee" },
    { email: "maria@ceiromao.com", password: "maria123", role: "Teacher" },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Ceiromao HR Portal</h1>
          <p className="text-gray-600 mt-2">Sign in to access your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn className="h-5 w-5" />
              Login
            </CardTitle>
            <CardDescription>Enter your credentials to access the system</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Demo Credentials</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {demoCredentials.map((cred, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="font-medium">{cred.role}:</span>
                <button
                  type="button"
                  onClick={() => {
                    setEmail(cred.email)
                    setPassword(cred.password)
                  }}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  {cred.email}
                </button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
