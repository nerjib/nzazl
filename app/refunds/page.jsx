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
import { httpGet, httpPost, httpPatch, httpPostFormData, customBaseUrl } from "@/lib/https"
import axios from "axios"
import { notification } from "antd"
import Swal from "sweetalert2"
import * as XLSX from 'xlsx';

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const s = String(dateString).trim();

  // 1. Try direct parse — handles full locale strings like
  //    "Tue Aug 01 2023 01:00:00 GMT+0100 (West Africa Standard Time)"
  //    and standard ISO strings.
  let date = new Date(s);
  if (!isNaN(date.getTime())) return date.toLocaleDateString();

  // 2. Handle "YYYY-MM" (no day) — append "-01" so it becomes a valid date.
  if (/^\d{4}-\d{2}$/.test(s)) {
    date = new Date(s + "-01");
    if (!isNaN(date.getTime())) return date.toLocaleDateString();
  }

  // 3. Normalize "YYYY-MM-DD HH:MM:SS.mmm +HH:MM" by replacing the first
  //    space with "T" and removing the second space before the offset.
  const normalized = s.replace(" ", "T").replace(" ", "");
  date = new Date(normalized);
  return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
};

export default function RefundsPage() {
  const searchParams = useSearchParams()
  const [refunds, setRefunds] = useState([])
  const [customers, setCustomers] = useState([])
  const [payments, setPayments] = useState([])
  const [newRefund, setNewRefund] = useState({
    payment_ippis: "",
    name: "",
    amount: "",
    payment_period: new Date().toISOString(),
    reason: "Overpayment",
    status: "Pending",
    command: "",
  })

  const downloadTemplate = () => {
    const data = [
      // Row 1: Title
      ["BULK REFUND UPLOAD", "", "", "", "", "", ""],
      // Row 2: Subtitle / Instructions
      ["Fill in data from Row 5 onwards. Do not modify rows 1–4.", "", "", "", "", "", ""],
      // Row 3: Empty / Notes
      ["Period must be a string e.g. 2024-01 (not a date cell). Amount must be a number.", "", "", "", "", "", ""],
      // Row 4: Column Headers — controller reads data from Row 5+
      ["IPPIS", "S/N", "Name", "Reason / Element", "Amount", "Period", "Command"],
      // Row 5+: Sample data rows
      ["PF0017275", 1, "SANDA GRACE", "Overpayment", 8000, "2024-01", "KADUNA STATE COMMAND"],
      ["PF0316447", 2, "Jane Smith", "Double deduction", 3000, "2024-02", "MDO"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);

    // Force Period column (F, index 5) cells to be text to prevent date coercion
    const dataRows = data.slice(4); // only sample rows
    dataRows.forEach((_, i) => {
      const cellRef = XLSX.utils.encode_cell({ r: i + 4, c: 5 });
      if (ws[cellRef]) {
        ws[cellRef].t = "s"; // string type
        ws[cellRef].z = "@"; // text format
      }
    });

    // Set column widths for readability
    ws["!cols"] = [
      { wch: 14 }, // A: IPPIS
      { wch: 6  }, // B: S/N
      { wch: 24 }, // C: Name
      { wch: 22 }, // D: Reason / Element
      { wch: 10 }, // E: Amount
      { wch: 12 }, // F: Period
      { wch: 28 }, // G: Command
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Refunds");
    XLSX.writeFile(wb, "refund_template.xlsx");
  };

  // -----------------------------------------------------------------
  // Load initial data & optionally pre-fill the form (runs once)
  // -----------------------------------------------------------------
  useEffect(() => {
    const fetchRefunds = async () => {
      const response = await axios.get(`${customBaseUrl.baseUrl}/api/v1/refunds`)
      if (response.data.status) {
        setRefunds(response.data.data)
      }
    }
    const fetchCustomers = async () => {
      const response = await httpGet("", "/api/v1/customers")
      if (response) {
        setCustomers(response)
      }
    }

    const fetchPayments = async () => {
      const response = await httpGet("", "/api/v1/payments")
      if (response) {
        setPayments(response)
      }
    }

    fetchRefunds()
    fetchCustomers()
    fetchPayments()

    }, []) //  <<–– run only once (dependency list is now empty)

  

  const handleAddRefund = async (e) => {
    e.preventDefault()

    const selectedCustomer = customers.find((c) => c.id === newRefund.customerId)
    // const { ippis, amount, reason, name, element, command }
    const refundData = {
      ippis: newRefund.payment_ippis,
      name: newRefund.name,
      amount: Number.parseFloat(newRefund.amount) || 0,
      period: newRefund.payment_period,
      reason: newRefund.reason,
      status: newRefund.status,
      command: newRefund.command,
      element: 'REFUND'
    }

    const response = await axios.post(`${customBaseUrl.baseUrl}/api/v1/refunds`, refundData)
    if (response) {
      setRefunds((prevRefunds) => [...prevRefunds, response])
      setNewRefund({
        payment_ippis: "",
        name: "",
        amount: "",
        payment_period: new Date().toISOString(),
        reason: "Overpayment",
        status: "Pending",
        command: "",
      })
    }
  }

  const handleBulkUpload = async (e) => {
    const file = e.target.files?.[0]
    console.log({file})
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    const response = await axios.post(`${customBaseUrl.baseUrl}/api/v1/refunds/bulk`, formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    if (response.data.status) {
      Swal.fire({
        icon: 'success',
        title: 'Bulk Upload Successful',
        text: ` refunds processed successfully.`,
      })
      notification.success({
        message: 'Bulk Upload Successful',
        description: ` refunds processed successfully.`,
      })

      // setRefunds((prevRefunds) => [...prevRefunds, ...response.data.data])
    } else{
      notification.error({
        message: 'Bulk Upload Failed',
        description: response.data.message || 'An error occurred during bulk upload.',
      })
    }
  }

  const updateRefundStatus = async (refundId, newStatus) => {
    const response = await httpPatch("", `/api/v1/refunds/${refundId}`, { status: newStatus })
    if (response) {
      setRefunds((prevRefunds) =>
        prevRefunds.map((refund) => (refund.id === refundId ? { ...refund, status: newStatus } : refund))
      )
    }
  }

  const totalRefunds = refunds.reduce((sum, refund) => sum + (Number(refund.amount) || 0), 0)
  const pendingRefunds = refunds.filter((r) => r.status === "pending").length
  const completedRefunds = refunds.filter((r) => r.status === "processed").length

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

          <Tabs defaultValue="list" className="space-y-6">
            <TabsList>
              <TabsTrigger value="list">Refund List</TabsTrigger>
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
                        <TableHead>Name</TableHead>
                        <TableHead>Payment IPPIS</TableHead>
                        <TableHead>Command</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {refunds.map((refund) => (
                        <TableRow key={refund.id}>
                          <TableCell>{formatDate(refund.payment_period)}</TableCell>
                          <TableCell className="font-medium">{refund.name}</TableCell>
                          <TableCell>{refund.payment_ippis}</TableCell>
                          <TableCell>{refund.command}</TableCell>
                          <TableCell className="text-red-600">₦{Number(refund.amount || 0).toLocaleString()}</TableCell>
                          <TableCell>{refund.reason}</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                refund.status === "processed"
                                  ? "default"
                                  : refund.status === "pending"
                                    ? "secondary"
                                    : "destructive"
                              }
                            >
                              {refund.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {refund.status === "pending" && (
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
                        <Label htmlFor="name">Customer Name *</Label>
                        <Input
                          id="name"
                          value={newRefund.name}
                          onChange={(e) => setNewRefund({ ...newRefund, name: e.target.value })}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="payment_ippis">Payment IPPIS</Label>
                        <Input
                          id="payment_ippis"
                          value={newRefund.payment_ippis}
                          onChange={(e) => setNewRefund({ ...newRefund, payment_ippis: e.target.value })}
                        />
                      </div>

                      <div>
                        <Label htmlFor="command">Command</Label>
                        <Input
                          id="command"
                          value={newRefund.command}
                          onChange={(e) => setNewRefund({ ...newRefund, command: e.target.value })}
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
                        <Label htmlFor="payment_period">Refund Date *</Label>
                        <Input
                          id="payment_period"
                          type="date"
                          value={new Date(newRefund.payment_period).toISOString().split("T")[0]}
                          onChange={(e) => setNewRefund({ ...newRefund, payment_period: e.target.value })}
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
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="processed">Processed</SelectItem>
                            <SelectItem value="rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Removed description field as it's not in the new API response */}

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
                    Upload an Excel file (.xlsx) with refund data.
                  </CardDescription>
                  <Button variant="outline" size="sm" onClick={downloadTemplate} className="mt-2">
                    Download Excel Template (.xlsx)
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="excelFile">Excel File (.xlsx)</Label>
                      <Input id="excelFile" type="file" accept=".xlsx" onChange={handleBulkUpload} />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      {/* <h4 className="font-medium mb-2">CSV Format Example:</h4> */}
                      {/* <code className="text-sm">
                        Customer Name,Property Title,Amount,Date,Reason,Status,Description
                        <br />
                        John Doe,Plot 1,50000,2024-01-15,Overpayment,Pending,Refund for overpayment
                      </code> */}
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
