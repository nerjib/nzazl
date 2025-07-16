"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Building, Plus, Layers, Eye } from "lucide-react"

export default function PaymentsPage() {
  const [payments, setPayments] = useState([])
  const [paymentBatches, setPaymentBatches] = useState([])
  const [customers, setCustomers] = useState([])
  const [newPayment, setNewPayment] = useState({
    customerId: "",
    customerName: "",
    propertyTitle: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    status: "Completed",
    description: "",
    batchId: "",
  })
  const [newBatch, setNewBatch] = useState({
    name: "",
    description: "",
    totalAmount: "",
  })

   const  getPayments = async () => {
      const res = await axios.get(`${customBaseUrl.baseUrl}`)
  
      if(res.data.status) {
        setCustomers(res.data.data);
        const startIndex = (pagination.page - 1) * pagination.size;
        const endIndex = startIndex + pagination.size;
        const paginatedCustomers = res.data.data.slice(startIndex, endIndex);
        setPaginatedUsers(paginatedCustomers)
      }
    }
  useEffect(() => {
   getPayments();
  }, [])

  const savePayments = (updatedPayments) => {
    setPayments(updatedPayments)
    localStorage.setItem("payments", JSON.stringify(updatedPayments))
  }

  const saveBatches = (updatedBatches) => {
    setPaymentBatches(updatedBatches)
    localStorage.setItem("paymentBatches", JSON.stringify(updatedBatches))
  }

  const handleCreateBatch = (e) => {
    e.preventDefault()

    const batch = {
      id: Date.now().toString(),
      name: newBatch.name,
      description: newBatch.description,
      totalAmount: Number.parseFloat(newBatch.totalAmount) || 0,
      createdDate: new Date().toISOString().split("T")[0],
      status: "Active",
      paymentCount: 0,
    }

    const updatedBatches = [...paymentBatches, batch]
    saveBatches(updatedBatches)

    setNewBatch({
      name: "",
      description: "",
      totalAmount: "",
    })
  }

  const handleAddPayment = (e) => {
    e.preventDefault()

    const selectedCustomer = customers.find((c) => c.id === newPayment.customerId)

    const payment = {
      id: Date.now().toString(),
      customerId: newPayment.customerId,
      customerName: selectedCustomer?.name || newPayment.customerName,
      propertyTitle: newPayment.propertyTitle,
      amount: Number.parseFloat(newPayment.amount) || 0,
      date: newPayment.date,
      status: newPayment.status,
      description: newPayment.description,
      batchId: newPayment.batchId,
    }

    const updatedPayments = [...payments, payment]
    savePayments(updatedPayments)

    // Update batch payment count
    if (newPayment.batchId) {
      const updatedBatches = paymentBatches.map((batch) =>
        batch.id === newPayment.batchId ? { ...batch, paymentCount: batch.paymentCount + 1 } : batch,
      )
      saveBatches(updatedBatches)
    }

    setNewPayment({
      customerId: "",
      customerName: "",
      propertyTitle: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
      status: "Completed",
      description: "",
      batchId: "",
    })
  }

  const handleBulkUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const csv = event.target?.result
      const lines = csv.split("\n")
      const newPayments = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim())
        if (values.length >= 6 && values[0]) {
          const payment = {
            id: Date.now().toString() + i,
            customerId: "",
            customerName: values[0] || "",
            propertyTitle: values[1] || "",
            amount: Number.parseFloat(values[2]) || 0,
            date: values[3] || new Date().toISOString().split("T")[0],
            status: values[4] || "Completed",
            description: values[5] || "",
            batchId: values[6] || "",
          }
          newPayments.push(payment)
        }
      }

      const updatedPayments = [...payments, ...newPayments]
      savePayments(updatedPayments)
    }

    reader.readAsText(file)
  }

  const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0)

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
                <div className="text-2xl font-bold text-green-600">₦{totalAmount.toLocaleString()}</div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="list" className="space-y-6">
            <TabsList>
              <TabsTrigger value="list">Payment List</TabsTrigger>
              <TabsTrigger value="batches">Payment Batches</TabsTrigger>
              <TabsTrigger value="add">Add Payment</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
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
                        <TableHead>Property</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Batch</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{payment.customerName}</TableCell>
                          <TableCell>{payment.propertyTitle}</TableCell>
                          <TableCell>₦{payment.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            <Badge variant={payment.status === "Completed" ? "default" : "secondary"}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {payment.batchId ? (
                              <Badge variant="outline">
                                {paymentBatches.find((b) => b.id === payment.batchId)?.name || payment.batchId}
                              </Badge>
                            ) : (
                              "Individual"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {payments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No payments found. Add your first payment record to get started.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="batches">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Create New Batch</CardTitle>
                    <CardDescription>Group payments into batches for better organization</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleCreateBatch} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="batchName">Batch Name *</Label>
                          <Input
                            id="batchName"
                            value={newBatch.name}
                            onChange={(e) => setNewBatch({ ...newBatch, name: e.target.value })}
                            placeholder="e.g., January 2024 Payments"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="batchAmount">Expected Total Amount (₦)</Label>
                          <Input
                            id="batchAmount"
                            type="number"
                            value={newBatch.totalAmount}
                            onChange={(e) => setNewBatch({ ...newBatch, totalAmount: e.target.value })}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="batchDescription">Description</Label>
                        <Textarea
                          id="batchDescription"
                          value={newBatch.description}
                          onChange={(e) => setNewBatch({ ...newBatch, description: e.target.value })}
                          placeholder="Batch description or notes"
                        />
                      </div>
                      <Button type="submit">
                        <Layers className="h-4 w-4 mr-2" />
                        Create Batch
                      </Button>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Payment Batches ({paymentBatches.length})</CardTitle>
                    <CardDescription>Manage your payment batches</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Batch Name</TableHead>
                          <TableHead>Created Date</TableHead>
                          <TableHead>Payment Count</TableHead>
                          <TableHead>Expected Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paymentBatches.map((batch) => {
                          const batchPayments = payments.filter((p) => p.batchId === batch.id)
                          const actualAmount = batchPayments.reduce((sum, p) => sum + p.amount, 0)

                          return (
                            <TableRow key={batch.id}>
                              <TableCell className="font-medium">{batch.name}</TableCell>
                              <TableCell>{new Date(batch.createdDate).toLocaleDateString()}</TableCell>
                              <TableCell>{batchPayments.length}</TableCell>
                              <TableCell>₦{batch.totalAmount.toLocaleString()}</TableCell>
                              <TableCell>
                                <Badge variant={batch.status === "Active" ? "default" : "secondary"}>
                                  {batch.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button size="sm" variant="outline">
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                    {paymentBatches.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No payment batches found. Create your first batch to get started.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
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
                        <Label htmlFor="customer">Customer</Label>
                        <Select
                          value={newPayment.customerId}
                          onValueChange={(value) => {
                            const customer = customers.find((c) => c.id === value)
                            setNewPayment({
                              ...newPayment,
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
                        {!newPayment.customerId && (
                          <Input
                            className="mt-2"
                            placeholder="Or enter customer name manually"
                            value={newPayment.customerName}
                            onChange={(e) => setNewPayment({ ...newPayment, customerName: e.target.value })}
                          />
                        )}
                      </div>

                      <div>
                        <Label htmlFor="batch">Payment Batch (Optional)</Label>
                        <Select
                          value={newPayment.batchId}
                          onValueChange={(value) => setNewPayment({ ...newPayment, batchId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select batch" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentBatches.map((batch) => (
                              <SelectItem key={batch.id} value={batch.id}>
                                {batch.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="propertyTitle">Property Title</Label>
                        <Input
                          id="propertyTitle"
                          value={newPayment.propertyTitle}
                          onChange={(e) => setNewPayment({ ...newPayment, propertyTitle: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="amount">Amount (₦) *</Label>
                        <Input
                          id="amount"
                          type="number"
                          value={newPayment.amount}
                          onChange={(e) => setNewPayment({ ...newPayment, amount: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="date">Date *</Label>
                        <Input
                          id="date"
                          type="date"
                          value={newPayment.date}
                          onChange={(e) => setNewPayment({ ...newPayment, date: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={newPayment.status}
                          onValueChange={(value) => setNewPayment({ ...newPayment, status: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={newPayment.description}
                        onChange={(e) => setNewPayment({ ...newPayment, description: e.target.value })}
                        placeholder="Payment description or notes"
                      />
                    </div>

                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
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
                    Upload a CSV file with payment data. Format: Customer Name, Property Title, Amount, Date, Status,
                    Description, Batch ID
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
                        Customer Name,Property Title,Amount,Date,Status,Description,Batch ID
                        <br />
                        John Doe,Plot 1,500000,2024-01-15,Completed,Initial payment,batch123
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
