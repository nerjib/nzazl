"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building, User, Shield, ArrowLeft } from "lucide-react"
import { customBaseUrl, httpPost } from '../../lib/https'
import axios from "axios"

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    role: "admin",
  })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Simulate login delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // const res = await httpPost(`${customBaseUrl.baseUrl}/api/v1/login`,
    //   {
    //     email: formData.email,
    //     password: formData.password
    //   }
    // )
    const res = await axios.post(`${customBaseUrl.baseUrl}/api/v1/login`,
      {
        email: formData.email,
        password: formData.password
      }
    )

    if (res.data.status && res.data.data.isAdmin) {
      // Store admin session
      localStorage.setItem(
        "userSession",
        JSON.stringify({
          email: formData.email,
          role: "admin",
          name: res.data.data.fullName,
          loginTime: new Date().toISOString(),
          token: res.data.data.token,
          userId: res.data.data.userId,
          phone: res.data.data.phoneNumber
        }),
      )
      router.push("/admin")
    } else if (res.data.status) {
      // Store customer session
      const customerIppis = res.data.data.ippis || res.data.data.userId || formData.email;
      const sessionData = {
        email: formData.email,
        role: "customer",
        customerId: res.data.data.userId,
        ippis: customerIppis,
        name: res.data.data.fullName,
        loginTime: new Date().toISOString(),
        token: res.data.data.token,
        userId: res.data.data.userId,
        phone: res.data.data.phoneNumber
      };
      localStorage.setItem("userSession", JSON.stringify(sessionData));
      localStorage.setItem("user", JSON.stringify({ ...res.data.data, ippis: customerIppis }));
      router.push("/customer")
    } else {
      setError("Invalid credentials. Please check your email, password, and role.")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Link>
          <div className="flex items-center justify-center mb-4">
            <Building className="h-12 w-12 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600">Sign in to your NMS Zazzau Properties account</p>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Login</CardTitle>
            <CardDescription className="text-center">Enter your credentials to access your account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">Account Type</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">
                      <div className="flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Admin Dashboard
                      </div>
                    </SelectItem>
                    <SelectItem value="customer">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Customer Portal
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type={formData.role === 'admin' ? "email" : 'text'}
                  placeholder={formData.role === 'admin' ? "Enter your email" : "enter your IPPIS"}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            {/* Demo Credentials */}
            {/* <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-sm text-gray-700 mb-2">Demo Credentials:</h4>
              <div className="space-y-2 text-xs text-gray-600">
                <div>
                  <strong>Admin:</strong> admin@zazzauproperties.com / admin123
                </div>
                <div>
                  <strong>Customer:</strong> customer@example.com / customer123
                </div>
              </div>
            </div> */}

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Need help?{" "}
                <a href="#" className="text-blue-600 hover:text-blue-700">
                  Contact Support
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
