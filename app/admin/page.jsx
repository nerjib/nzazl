"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, CreditCard, Building, TrendingUp, Layers, LogOut } from "lucide-react"

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalPayments: 0,
    totalProperties: 0,
    totalRevenue: 0,
    totalBatches: 0,
    totalRefunds: 0,
  })

  useEffect(() => {
    // Check authentication
    const session = localStorage.getItem("userSession")
    if (!session) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(session)
    if (userData.role !== "admin") {
      router.push("/login")
      return
    }

    setUser(userData)

    // Load stats from localStorage
    const customers = JSON.parse(localStorage.getItem("customers") || "[]")
    const payments = JSON.parse(localStorage.getItem("payments") || "[]")
    const batches = JSON.parse(localStorage.getItem("paymentBatches") || "[]")
    const refunds = JSON.parse(localStorage.getItem("refunds") || "[]")

    const totalRevenue = payments.reduce((sum, payment) => sum + Number.parseFloat(payment.amount || 0), 0)
    const totalRefundAmount = refunds.reduce((sum, refund) => sum + Number.parseFloat(refund.amount || 0), 0)
    const totalProperties = customers.reduce((sum, customer) => sum + (customer.properties?.length || 0), 0)

    setStats({
      totalCustomers: customers.length,
      totalPayments: payments.length,
      totalProperties,
      totalRevenue: totalRevenue - totalRefundAmount,
      totalBatches: batches.length,
      totalRefunds: refunds.length,
    })
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("userSession")
    router.push("/")
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
            <img src="/zazzauIcon.png" alt="Zazzau Logo" className="h-8 w-8" />
            <span className="ml-2 text-xl font-bold text-gray-900">NMS Zazzau Properties - Admin</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
              <Link href="/admin/customers">
                <Button variant="ghost">Customers</Button>
              </Link>
              <Link href="/admin/payments">
                <Button variant="ghost">Payments</Button>
              </Link>
              <Link href="/admin/refunds">
                <Button variant="ghost">Refunds</Button>
              </Link>
              <Button variant="outline" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalCustomers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Properties</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProperties}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payment Batches</CardTitle>
                <Layers className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBatches}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalPayments}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₦{stats.totalRevenue.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Refunds</CardTitle>
                <CreditCard className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.totalRefunds}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Manage your property business</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Link href="/admin/customers">
                  <Button className="w-full justify-start">
                    <Users className="mr-2 h-4 w-4" />
                    Manage Customers
                  </Button>
                </Link>
                <Link href="/admin/payments">
                  <Button className="w-full justify-start" variant="outline">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Manage Payments
                  </Button>
                </Link>
                <Link href="/admin/refunds">
                  <Button className="w-full justify-start" variant="outline">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Process Refunds
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Status</CardTitle>
                <CardDescription>Current system information</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">System Status</span>
                    <span className="text-sm font-medium text-green-600">Online</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Last Login</span>
                    <span className="text-sm font-medium">{new Date(user.loginTime).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Role</span>
                    <span className="text-sm font-medium">Administrator</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
