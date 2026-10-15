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
import { Building, Search, Calendar, RefreshCw, Home, CheckCircle2 } from "lucide-react"
import { customBaseUrl } from "@/lib/https"
import { notification } from "antd"
import HousingPaymentUploadCard from "@/components/HousingPaymentUploadCard"
import { getAllHousePayments } from "@/services/zazzauPayments"

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  const s = String(dateString).trim();
  let date = new Date(s);
  if (!isNaN(date.getTime())) return date.toLocaleDateString();
  if (/^\d{4}-\d{2}$/.test(s)) {
    date = new Date(s + "-01");
    if (!isNaN(date.getTime())) return date.toLocaleDateString();
  }
  const normalized = s.replace(" ", "T").replace(" ", "");
  date = new Date(normalized);
  return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
};

export default function PaymentsPage() {
  const router = useRouter()
  
  // Land Payments state
  const [payments, setPayments] = useState([])
  const [pagination, setPagination] = useState({ page: 0, size: 10 })
  const [analytics, setAnalytics] = useState(null)
  const [filter, setFilter] = useState({ type: "ippis", value: "" })

  // Housing Payments state (GET /api/v1/house-payments)
  const [housePayments, setHousePayments] = useState([])
  const [housePagination, setHousePagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0, totalAmount: 0 })
  const [houseFilter, setHouseFilter] = useState({ search: "", period: "" })
  const [houseLoading, setHouseLoading] = useState(false)

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
    setPayments(res.data.data || [])
  }

  const getAnalytics = async () => {
    try {
      const res = await axios.get(`${customBaseUrl.baseUrl}/api/v1/payments/totalpayments`)
      setAnalytics(res.data.data[0])
    } catch (e) {
      console.error("Error fetching analytics:", e)
    }
  }

  const getHousePayments = async (
    page = housePagination.page,
    limit = housePagination.limit,
    search = houseFilter.search,
    period = houseFilter.period
  ) => {
    setHouseLoading(true);
    try {
      const res = await getAllHousePayments({ page, limit, search, period });
      if (res.status) {
        setHousePayments(res.data);
        setHousePagination(res.pagination);
      }
    } catch (err) {
      console.error("Error fetching house payments:", err);
    } finally {
      setHouseLoading(false);
    }
  };

  const handleHouseSearch = (e) => {
    e.preventDefault();
    getHousePayments(1, housePagination.limit, houseFilter.search, houseFilter.period);
  };

  const handleHouseReset = () => {
    setHouseFilter({ search: "", period: "" });
    getHousePayments(1, housePagination.limit, "", "");
  };

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
    getHousePayments(1, 50, "", "")
  }, [pagination.page, pagination.size, filter.value === ""])

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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
              <p className="text-sm text-gray-500 mt-1">Manage and track Land & Housing salary deduction payments</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-xs uppercase font-semibold text-gray-500">Total Land Deductions</div>
                <div className="text-2xl font-bold text-green-600 font-mono">
                  ₦{analytics ? Number(analytics.sum).toLocaleString() : "0"}
                </div>
              </div>
              {housePagination.totalAmount > 0 && (
                <div className="text-right border-l pl-6">
                  <div className="text-xs uppercase font-semibold text-gray-500">Total Housing Deductions</div>
                  <div className="text-2xl font-bold text-indigo-600 font-mono">
                    ₦{Number(housePagination.totalAmount).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="list" className="space-y-6">
            <TabsList className="bg-gray-100 p-1 rounded-xl">
              <TabsTrigger value="list" className="rounded-lg">Land Payments</TabsTrigger>
              <TabsTrigger value="housing-list" className="rounded-lg flex items-center gap-1.5">
                <Home className="h-3.5 w-3.5" />
                <span>Housing Payments ({housePagination.total})</span>
              </TabsTrigger>
              <TabsTrigger value="add" className="rounded-lg">Add Land Payment</TabsTrigger>
              <TabsTrigger value="bulk" className="rounded-lg">Bulk Upload (Land)</TabsTrigger>
              <TabsTrigger value="housing" className="rounded-lg">Upload Housing</TabsTrigger>
            </TabsList>

            {/* Land Payments List Tab */}
            <TabsContent value="list">
              <Card>
                <CardHeader>
                  <CardTitle>Land Payments ({payments.length})</CardTitle>
                  <CardDescription>Track all land deduction payment records</CardDescription>
                  <div className="flex items-center space-x-4 mt-2">
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
                    <Button variant="outline" onClick={() => setFilter({ type: "ippis", value: "" })}>Cancel</Button>
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
                        <TableRow key={payment.ref} onClick={() => router.push(`/admin/customers/view?id=${payment.ippis}`)} className="cursor-pointer hover:bg-gray-100">
                          <TableCell>{formatDate(payment.period)}</TableCell>
                          <TableCell className="font-medium">{payment.name}</TableCell>
                          <TableCell>{payment.element}</TableCell>
                          <TableCell className="font-semibold text-green-700">₦{Number(payment.amount || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-mono">{payment.ippis}</TableCell>
                          <TableCell className="text-xs text-gray-500">{payment.command}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {payments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No land payments found.
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

            {/* Housing Payments List Tab (GET /api/v1/house-payments) */}
            <TabsContent value="housing-list">
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Home className="h-5 w-5 text-indigo-600" />
                        <span>All Housing Payments ({housePagination.total})</span>
                      </CardTitle>
                      <CardDescription>
                        All uploaded housing salary deduction records (supports filtering by IPPIS, Name, Legacy ID, or Period)
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => getHousePayments()}
                        disabled={houseLoading}
                        className="text-xs gap-1.5"
                      >
                        <RefreshCw className={`h-3.5 w-3.5 ${houseLoading ? "animate-spin" : ""}`} />
                        <span>Refresh</span>
                      </Button>
                    </div>
                  </div>

                  {/* Filter Form */}
                  <form onSubmit={handleHouseSearch} className="flex flex-wrap items-center gap-3 pt-4 border-t border-gray-100">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search IPPIS, Name, Legacy ID..."
                        value={houseFilter.search}
                        onChange={(e) => setHouseFilter({ ...houseFilter, search: e.target.value })}
                        className="pl-9 h-9 text-xs rounded-lg"
                      />
                    </div>

                    <div className="relative w-44">
                      <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        type="text"
                        placeholder="Period (e.g. 2024-05-01)"
                        value={houseFilter.period}
                        onChange={(e) => setHouseFilter({ ...houseFilter, period: e.target.value })}
                        className="pl-9 h-9 text-xs rounded-lg font-mono"
                      />
                    </div>

                    <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-xs h-9">
                      Filter Records
                    </Button>
                    {(houseFilter.search || houseFilter.period) && (
                      <Button type="button" variant="outline" size="sm" onClick={handleHouseReset} className="text-xs h-9">
                        Clear Filters
                      </Button>
                    )}
                  </form>
                </CardHeader>

                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Period</TableHead>
                          <TableHead>Staff ID (IPPIS)</TableHead>
                          <TableHead>Legacy ID</TableHead>
                          <TableHead>Full Name</TableHead>
                          <TableHead>Scheme / Element</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Command</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {housePayments.map((payment, idx) => (
                          <TableRow
                            key={payment.id || payment.ref || `hp-${idx}`}
                            onClick={() => payment.ippis && router.push(`/admin/customers/view?id=${payment.ippis}`)}
                            className="cursor-pointer hover:bg-indigo-50/40 transition-colors"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                              {formatDate(payment.period)}
                            </td>
                            <td className="px-4 py-3 font-mono font-medium text-indigo-700 whitespace-nowrap">
                              {payment.ippis}
                            </td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                              {payment.legacyid || "-"}
                            </td>
                            <td className="px-4 py-3 font-semibold text-gray-900 whitespace-nowrap">
                              {payment.name || payment.fullname || "-"}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-600">
                              {payment.element || "Housing Scheme Contribution"}
                            </td>
                            <td className="px-4 py-3 font-bold text-indigo-600 font-mono whitespace-nowrap">
                              ₦{Number(payment.amount || 0).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                              {payment.command || "-"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50 capitalize">
                                <CheckCircle2 className="h-3 w-3" />
                                {payment.status || "paid"}
                              </span>
                            </td>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {housePayments.length === 0 && !houseLoading && (
                    <div className="text-center py-12 space-y-2">
                      <div className="mx-auto h-12 w-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <Home className="h-6 w-6" />
                      </div>
                      <p className="text-base font-semibold text-gray-800">No housing payment records found.</p>
                      <p className="text-xs text-gray-400">
                        {houseFilter.search || houseFilter.period
                          ? "Try adjusting your search query or period filter."
                          : "Upload housing payments via the 'Upload Housing' tab above."}
                      </p>
                    </div>
                  )}

                  {/* Housing Pagination */}
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-t border-gray-100 mt-4 text-xs text-gray-500">
                    <div>
                      Showing <strong className="text-gray-900">{housePayments.length}</strong> of{" "}
                      <strong className="text-gray-900">{housePagination.total}</strong> records
                      {housePagination.totalAmount > 0 && (
                        <span> | Total Amount: <strong className="text-indigo-700 font-mono">₦{Number(housePagination.totalAmount).toLocaleString()}</strong></span>
                      )}
                    </div>

                    <div className="flex items-center space-x-3">
                      <div className="flex items-center gap-1.5">
                        <span>Rows:</span>
                        <Select
                          value={String(housePagination.limit)}
                          onValueChange={(val) => {
                            const newLimit = Number(val);
                            getHousePayments(1, newLimit);
                          }}
                        >
                          <SelectTrigger className="w-[85px] h-8 text-xs">
                            <SelectValue placeholder="Limit" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="25">25</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <span className="font-medium text-gray-700">
                        Page {housePagination.page} of {housePagination.totalPages || 1}
                      </span>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => getHousePayments(housePagination.page - 1, housePagination.limit)}
                        disabled={housePagination.page <= 1 || houseLoading}
                        className="h-8 text-xs px-2.5"
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => getHousePayments(housePagination.page + 1, housePagination.limit)}
                        disabled={housePagination.page >= housePagination.totalPages || houseLoading}
                        className="h-8 text-xs px-2.5"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Add Land Payment Tab */}
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

            {/* Bulk Upload (Land) Tab */}
            <TabsContent value="bulk">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Upload Land Payments</CardTitle>
                  <CardDescription>
                    Upload an Excel or CSV file with land deduction payment data.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="csvFile">Excel / CSV File</Label>
                      <Input id="csvFile" type="file" accept=".csv,.xlsx,.xls" onChange={handleBulkUpload} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Upload Housing Tab */}
            <TabsContent value="housing">
              <HousingPaymentUploadCard
                onUploadSuccess={() => {
                  getPayments();
                  getAnalytics();
                  getHousePayments(1, housePagination.limit);
                }}
              />
            </TabsContent>

            {/* Refund Payment Tab */}
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
