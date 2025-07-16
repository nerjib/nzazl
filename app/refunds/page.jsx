"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building, Plus, AlertTriangle, CheckCircle } from "lucide-react"

export default function RefundsPage() {
  const searchParams = useSearchParams()
  const [refunds, setRefunds] = useState([])
  const [customers, setCustomers] = useState([])
  const [payments, setPayments] = useState([])
  const [newRefund, setNewRefund] = useState({
    customerId: "",
    customerName: "",
    propertyTitle: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    reason: "Overpayment",
    status: "Pending",
    description: "",
  })

  // -----------------------------------------------------------------
  // Load initial data & optionally pre-fill the form (runs once)
  // -----------------------------------------------------------------
  useEffect(() => {
    // Refunds
    const savedRefunds = localStorage.getItem("refunds")
    if (savedRefunds) setRefunds(JSON.parse(savedRefunds))

    // Customers
    const savedCustomers = localStorage.getItem("customers")
    if (savedCustomers) setCustomers(JSON.parse(savedCustomers))

    // Payments
    const savedPayments = localStorage.getItem("payments")
    if (savedPayments) setPayments(JSON.parse(savedPayments))

    // ---- Pre-fill refund form when coming from a customer profile ----
    const customerId = searchParams.get("customerId")
    const propertyTitle = searchParams.get("propertyTitle")
    const amount = searchParams.get("amount")

    if (customerId && propertyTitle && amount) {
      const customer = JSON.parse(localStorage.getItem("customers") || "[]").find((c) => c.id === customerId) ?? {}

      setNewRefund((prev) => ({
        ...prev, // keep any default values
        customerId,
        customerName: customer.name ?? "",
        propertyTitle,
        amount,
        reason: "Overpayment",
      }))
    }
  }, []) //  <<–– run only once (dependency list is now empty)

  const saveRefunds = (updatedRefunds) => {
    setRefunds(updatedRefunds)
    localStorage.setItem("refunds", JSON.stringify(updatedRefunds))
  }

  const handleAddRefund = (e) => {
    e.preventDefault()

    const selectedCustomer = customers.find((c) => c.id === newRefund.customerId)

    const refund = {
      id: Date.now().toString(),
      customerId: newRefund.customerId,
      customerName: selectedCustomer?.name || newRefund.customerName,
      propertyTitle: newRefund.propertyTitle,
      amount: Number.parseFloat(newRefund.amount) || 0,
      date: newRefund.date,
      reason: newRefund.reason,
      status: newRefund.status,
      description: newRefund.description,
      processedDate: new Date().toISOString(),
    }

    const updatedRefunds = [...refunds, refund]
    saveRefunds(updatedRefunds)

    setNewRefund({
      customerId: "",
      customerName: "",
      propertyTitle: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      reason: "Overpayment",
      status: "Pending",
      description: "",
    })
  }

  const handleBulkUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const csv = event.target?.result
      const lines = csv.split("\n")
      const newRefunds = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim())
        if (values.length >= 6 && values[0]) {
          const refund = {
            id: Date.now().toString() + i,
            customerId: "",
            customerName: values[0] || "",
            propertyTitle: values[1] || "",
            amount: Number.parseFloat(values[2]) || 0,
            date: values[3] || new Date().toISOString().split("T")[0],
            reason: values[4] || "Overpayment",
            status: values[5] || "Pending",
            description: values[6] || "",
            processedDate: new Date().toISOString(),
          }
          newRefunds.push(refund)
        }
      }

      const updatedRefunds = [...refunds, ...newRefunds]
      saveRefunds(updatedRefunds)
    }

    reader.readAsText(file)
  }

  const updateRefundStatus = (refundId, newStatus) => {
    const updatedRefunds = refunds.map((refund) => (refund.id === refundId ? { ...refund, status: newStatus } : refund))
    saveRefunds(updatedRefunds)
  }

  const getOverpayments = () => {
    const overpayments = []

    customers.forEach((customer) => {
      const customerPayments = payments.filter((p) => p.customerId === customer.id)
      const propertyPayments = {}

      // Group payments by property
      customerPayments.forEach((payment) => {
        if (!propertyPayments[payment.propertyTitle]) {
          propertyPayments[payment.propertyTitle] = {
            totalPaid: 0,
            expectedAmount: 0,
          }
        }
        propertyPayments[payment.propertyTitle].totalPaid += payment.amount
      })

      // Set expected amounts from customer properties
      customer.properties.forEach((property) => {
        if (propertyPayments[property.title]) {
          propertyPayments[property.title].expectedAmount = property.price
        }
      })

      // Find overpayments
      Object.entries(propertyPayments).forEach(([propertyTitle, data]) => {
        if (data.totalPaid > data.expectedAmount && data.expectedAmount > 0) {
          overpayments.push({
            customerId: customer.id,
            customerName: customer.name,
            propertyTitle,
            overpaidAmount: data.totalPaid - data.expectedAmount,
            totalPaid: data.totalPaid,
            expectedAmount: data.expectedAmount,
          })
        }
      })
    })

    return overpayments
  }

  const overpayments = getOverpayments()
  const totalRefunds = refunds.reduce((sum, refund) => sum + refund.amount, 0)
  const pendingRefunds = refunds.filter((r) => r.status === "Pending").length
  const completedRefunds = refunds.filter((r) => r.status === "Completed").length

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
              <Link href="/customers">
                <Button variant="ghost">Customers</Button>
              </Link>
              <Link href="/payments">
                <Button variant="ghost">Payments</Button>
              </Link>
              <Link href="/refunds">
                <Button variant="default">Refunds</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Refund Management</h1>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-sm text-gray-600">Total Refunds</div>
                <div className="text-2xl font-bold text-red-600">₦{totalRefunds.toLocaleString()}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">Pending</div>
                <div className="text-xl font-bold text-orange-600">{pendingRefunds}</div>
              </div>
            </div>
          </div>

          {/* Overpayment Alerts */}
          {overpayments.length > 0 && (
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium text-orange-800 mb-2">
                  {overpayments.length} customer(s) have overpayments that may require refunds:
                </div>
                <div className="space-y-1">
                  {overpayments.slice(0, 3).map((overpayment, index) => (
                    <div key={index} className="text-sm text-orange-700">
                      • {overpayment.customerName} - {overpayment.propertyTitle}: ₦
                      {overpayment.overpaidAmount.toLocaleString()} overpaid
                    </div>
                  ))}
                  {overpayments.length > 3 && (
                    <div className="text-sm text-orange-700">... and {overpayments.length - 3} more</div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="list" className="space-y-6">
            <TabsList>
              <TabsTrigger value="list">Refund List</TabsTrigger>
              <TabsTrigger value="overpayments">Detected Overpayments</TabsTrigger>
              <TabsTrigger value="add">Process Refund</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <Card>
                <CardHeader>
                  <CardTitle>All Refunds ({refunds.length})</CardTitle>
                  <CardDescription>Track all refund transactions</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refunds.map((refund) => (
                        <TableRow key={refund.id}>
                          <TableCell>{new Date(refund.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{refund.customerName}</TableCell>
                          <TableCell>{refund.propertyTitle}</TableCell>
                          <TableCell className="text-red-600">₦{refund.amount.toLocaleString()}</TableCell>
                          <TableCell>{refund.reason}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                refund.status === "Completed"
                                  ? "default"
                                  : refund.status === "Pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {refund.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {refund.status === "Pending" && (
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => updateRefundStatus(refund.id, "Completed")}
                                  className="bg-green-600 hover:bg-green-700"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => updateRefundStatus(refund.id, "Rejected")}
                                >
                                  Reject
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {refunds.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No refunds found. Process your first refund to get started.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="overpayments">
              <Card>
                <CardHeader>
                  <CardTitle>Detected Overpayments ({overpayments.length})</CardTitle>
                  <CardDescription>Customers who have paid more than the property price</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Expected Amount</TableHead>
                        <TableHead>Total Paid</TableHead>
                        <TableHead>Overpaid Amount</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overpayments.map((overpayment, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{overpayment.customerName}</TableCell>
                          <TableCell>{overpayment.propertyTitle}</TableCell>
                          <TableCell>₦{overpayment.expectedAmount.toLocaleString()}</TableCell>
                          <TableCell>₦{overpayment.totalPaid.toLocaleString()}</TableCell>
                          <TableCell className="text-red-600 font-medium">
                            ₦{overpayment.overpaidAmount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              onClick={() => {
                                setNewRefund({
                                  ...newRefund,
                                  customerId: overpayment.customerId,
                                  customerName: overpayment.customerName,
                                  propertyTitle: overpayment.propertyTitle,
                                  amount: overpayment.overpaidAmount.toString(),
                                  reason: "Overpayment",
                                })
                              }}
                            >
                              Process Refund
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {overpayments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                      No overpayments detected. All customer payments are within expected amounts.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="add">
              <Card>
                <CardHeader>
                  <CardTitle>Process New Refund</CardTitle>
                  <CardDescription>Create a refund transaction for a customer</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddRefund} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customer">Customer</Label>
                        <Select
                          value={newRefund.customerId}
                          onValueChange={(value) => {
                            const customer = customers.find((c) => c.id === value)
                            setNewRefund({
                              ...newRefund,
                              customerId: value,
                              customerName: customer?.name || "",
                            })
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select customer" />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {!newRefund.customerId && (
                          <Input
                            className="mt-2"
                            placeholder="Or enter customer name manually"
                            value={newRefund.customerName}
                            onChange={(e) => setNewRefund({ ...newRefund, customerName: e.target.value })}
                          />
                        )}
                      </div>

                      <div>
                        <Label htmlFor="propertyTitle">Property Title *</Label>
                        <Input
                          id="propertyTitle"
                          value={newRefund.propertyTitle}
                          onChange={(e) => setNewRefund({ ...newRefund, propertyTitle: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="amount">Refund Amount (₦) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={newRefund.amount}
                          onChange={(e) => setNewRefund({ ...newRefund, amount: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="date">Refund Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newRefund.date}
                          onChange={(e) => setNewRefund({ ...newRefund, date: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="reason">Reason</Label>
                        <Select
                          value={newRefund.reason}
                          onValueChange={(value) => setNewRefund({ ...newRefund, reason: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Overpayment">Overpayment</SelectItem>
                            <SelectItem value="Cancellation">Property Cancellation</SelectItem>
                            <SelectItem value="Error">Payment Error</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={newRefund.status}
                          onValueChange={(value) => setNewRefund({ ...newRefund, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newRefund.description}
                        onChange={(e) => setNewRefund({ ...newRefund, description: e.target.value })}
                        placeholder="Additional notes about the refund"
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Process Refund
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Upload Refunds</CardTitle>
                  <CardDescription>
                    Upload a CSV file with refund data. Format: Customer Name, Property Title, Amount, Date, Reason,
                    Status, Description
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="csvFile">CSV File</Label>
                      <Input id="csvFile" type="file" accept=".csv" onChange={handleBulkUpload} />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">CSV Format Example:</h4>
                      <code className="text-sm">
                        Customer Name,Property Title,Amount,Date,Reason,Status,Description
                        <br />
                        John Doe,Plot 1,50000,2024-01-15,Overpayment,Pending,Refund for overpayment
                      </code>
                    </div>
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
