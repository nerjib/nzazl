"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building } from "lucide-react"
import { customBaseUrl } from "@/lib/https"
import { notification } from "antd"

export default function PaymentsPage() {
  const router = useRouter()
  const [payments, setPayments] = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10 })
  const [analytics, setAnalytics] = useState(null)
  const [filter, setFilter] = useState({ type: "ippis", value: "" })

  const getPayments = async () => {
    let url = `${customBaseUrl.baseUrl}/api/v1/payments/paginated?page=${pagination.page}&size=${pagination.size}`
    if (filter.value) {
      if (filter.type === "ippis") {
        url = `${customBaseUrl.baseUrl}/api/v1/payments/single/customer/${filter.value}`
      } else if (filter.type === "amount") {
        url = `${customBaseUrl.baseUrl}/api/v1/payments/range/${filter.value}`
      }
    }
    const res = await axios.get(url)
    setPayments(res.data.data || res.data.data)
  }

  const getAnalytics = async () => {
    const res = await axios.get(`${customBaseUrl.baseUrl}/api/v1/payments/totalpayments`)
    setAnalytics(res.data.data[0])
  }

  const handleAddPayment = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    await axios.post(`${customBaseUrl.baseUrl}/api/v1/payments`, data)
    getPayments()
  }

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("file", file)
    const res = await axios.post(`${customBaseUrl.baseUrl}/api/v1/excel/payments`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    if(res.data.status){
      notification.success({
        message: "Bulk Upload Successful",
        description: `payments processed successfully.`,
      })
    } else {
      notification.error({
        message: "Bulk Upload Failed",
        description: res.data.message || "An error occurred during bulk upload.",
      })
    }
    getPayments()
  }

  const handleRefund = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const data = Object.fromEntries(formData.entries())
    await axios.post(`${customBaseUrl.baseUrl}/api/v1/refunds`, data)
    getPayments()
  }

  useEffect(() => {
    getPayments()
    getAnalytics()
  }, [pagination, filter.value === ""])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin">
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
              <TabsTrigger value="add">Add Payment</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
              {/* <TabsTrigger value="refund">Refund Payment</TabsTrigger> */}
            </TabsList>

            <TabsContent value="list">
              <Card>
                <CardHeader>
                  <CardTitle>All Payments ({payments.length})</CardTitle>
                  <CardDescription>Track all payment records</CardDescription>
                  <div className="flex items-center space-x-4">
                    <Select
                      value={filter.type}
                      onValueChange={(value) => setFilter({ ...filter, type: value })}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select filter type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ippis">IPPIS</SelectItem>
                        <SelectItem value="amount">Amount</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder={`Filter by ${filter.type}`}
                      value={filter.value}
                      onChange={(e) => setFilter({ ...filter, value: e.target.value })}
                      className="max-w-sm"
                    />
                    <Button onClick={getPayments}>Filter</Button>
                    <Button onClick={() => setFilter({ type: "ippis", value: "" })}>Cancel</Button>
                  </div>
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
                        <TableRow key={payment.ref} onClick={() => router.push(`/admin/customers/${payment.ippis}`)} className="cursor-pointer hover:bg-gray-100">
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

            <TabsContent value="add">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Payment</CardTitle>
                  <CardDescription>Record a new payment transaction</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddPayment} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Customer Name</Label>
                        <Input id="name" name="name" required />
                      </div>
                      <div>
                        <Label htmlFor="ippis">IPPIS</Label>
                        <Input id="ippis" name="ippis" required />
                      </div>
                      <div>
                        <Label htmlFor="element">Element</Label>
                        <Input id="element" name="element" required />
                      </div>
                      <div>
                        <Label htmlFor="amount">Amount</Label>
                        <Input id="amount" name="amount" type="number" required />
                      </div>
                      <div>
                        <Label htmlFor="period">Period</Label>
                        <Input id="period" name="period" type="date" required />
                      </div>
                      <div>
                        <Label htmlFor="command">Command</Label>
                        <Input id="command" name="command" required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full">
                      Add Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Upload Payments</CardTitle>
                  <CardDescription>
                    Upload a CSV file with payment data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="csvFile">CSV File</Label>
                      <Input id="csvFile" type="file" accept=".csv/.xlxs" onChange={handleBulkUpload} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="refund">
              <Card>
                <CardHeader>
                  <CardTitle>Refund Payment</CardTitle>
                  <CardDescription>Refund a payment by its reference number, IPPIS, and amount</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleRefund} className="space-y-6">
                    <div>
                      <Label htmlFor="refundRef">Payment Reference (Ref)</Label>
                      <Input id="refundRef" name="ref" required />
                    </div>
                    <div>
                      <Label htmlFor="refundIppis">IPPIS Number</Label>
                      <Input id="refundIppis" name="ippis" required />
                    </div>
                    <div>
                      <Label htmlFor="refundAmount">Amount</Label>
                      <Input id="refundAmount" name="amount" type="number" required />
                    </div>
                    <Button type="submit" className="w-full">
                      Refund Payment
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
