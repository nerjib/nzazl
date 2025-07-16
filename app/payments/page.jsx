"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building } from "lucide-react"
import { customBaseUrl } from "@/lib/https"

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10 })
  const [analytics, setAnalytics] = useState(null)

  const getPayments = async () => {
    const res = await axios.get(
      `${customBaseUrl.baseUrl}/api/v1/payments/paginated?page=${pagination.page}&size=${pagination.size}`
    )
    setPayments(res.data.data)
  }

  const getAnalytics = async () => {
    const res = await axios.get(`${customBaseUrl.baseUrl}/api/v1/payments/totalpayments`)
    setAnalytics(res.data.data[0])
  }

  useEffect(() => {
    getPayments()
    getAnalytics()
  }, [pagination])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">NMS Zazzau Properties</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/customers">
                <Button variant="ghost">Customers</Button>
              </Link>
              <Link href="/payments">
                <Button variant="default">Payments</Button>
              </Link>
              <Link href="/refunds">
                <Button variant="ghost">Refunds</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Payments</div>
                <div className="text-2xl font-bold text-green-600">
                  ₦{analytics ? Number(analytics.sum).toLocaleString() : "0"}
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="list" className="space-y-6">
            <TabsList>
              <TabsTrigger value="list">Payment List</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <Card>
                <CardHeader>
                  <CardTitle>All Payments ({payments.length})</CardTitle>
                  <CardDescription>Track all payment records</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Element</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>IPPIS</TableHead>
                        <TableHead>Command</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.ref}>
                          <TableCell>{new Date(payment.period).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{payment.name}</TableCell>
                          <TableCell>{payment.element}</TableCell>
                          <TableCell>₦{payment.amount.toLocaleString()}</TableCell>
                          <TableCell>{payment.ippis}</TableCell>
                          <TableCell>{payment.command}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {payments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No payments found.
                    </div>
                  )}
                <div className="flex items-center justify-end space-x-2 py-4">
                    <Select
                      value={pagination.size}
                      onValueChange={(value) => setPagination({ ...pagination, size: value })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select page size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={10}>10 per page</SelectItem>
                        <SelectItem value={20}>20 per page</SelectItem>
                        <SelectItem value={50}>50 per page</SelectItem>
                        <SelectItem value={100}>100 per page</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
                      disabled={pagination.page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
                    >
                      Next
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
