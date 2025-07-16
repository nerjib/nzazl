"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building, ArrowLeft, Mail, Phone, MapPin, AlertTriangle, LogOut } from "lucide-react"

export default function AdminCustomerProfile() {
  const router = useRouter()
  const params = useParams()
  const customerId = params.id
  const [user, setUser] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [payments, setPayments] = useState([])
  const [refunds, setRefunds] = useState([])
  const [overpayments, setOverpayments] = useState([])

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

    // Load customer data
    const savedCustomers = localStorage.getItem("customers")
    if (savedCustomers) {
      const customers = JSON.parse(savedCustomers)
      const foundCustomer = customers.find((c) => c.id === customerId)
      setCustomer(foundCustomer || null)
    }

    // Load payments for this customer
    const savedPayments = localStorage.getItem("payments")
    if (savedPayments) {
      const allPayments = JSON.parse(savedPayments)
      const customerPayments = allPayments.filter((p) => p.customerId === customerId)
      setPayments(customerPayments)
    }

    // Load refunds for this customer
    const savedRefunds = localStorage.getItem("refunds")
    if (savedRefunds) {
      const allRefunds = JSON.parse(savedRefunds)
      const customerRefunds = allRefunds.filter((r) => r.customerId === customerId)
      setRefunds(customerRefunds)
    }
  }, [customerId, router])

  useEffect(() => {
    // Calculate overpayments
    if (customer && payments.length > 0) {
      const propertyPayments = {}

      // Group payments by property
      payments.forEach((payment) => {
        if (!propertyPayments[payment.propertyTitle]) {
          propertyPayments[payment.propertyTitle] = {
            totalPaid: 0,
            expectedAmount: 0,
            payments: [],
          }
        }
        propertyPayments[payment.propertyTitle].totalPaid += payment.amount
        propertyPayments[payment.propertyTitle].payments.push(payment)
      })

      // Set expected amounts from customer properties
      customer.properties.forEach((property) => {
        if (propertyPayments[property.title]) {
          propertyPayments[property.title].expectedAmount = property.price
        }
      })

      // Find overpayments
      const overpaid = []
      Object.entries(propertyPayments).forEach(([propertyTitle, data]) => {
        if (data.totalPaid > data.expectedAmount && data.expectedAmount > 0) {
          overpaid.push({
            propertyTitle,
            overpaidAmount: data.totalPaid - data.expectedAmount,
            totalPaid: data.totalPaid,
            expectedAmount: data.expectedAmount,
          })
        }
      })

      setOverpayments(overpaid)
    }
  }, [customer, payments])

  const handleLogout = () => {
    localStorage.removeItem("userSession")
    router.push("/")
  }

  if (!user) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
  }

  if (!customer) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Customer Not Found</h2>
          <Link href="/admin/customers">
            <Button>Back to Customers</Button>
          </Link>
        </div>
      </div>
    )
  }

  const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0)
  const totalRefunds = refunds.reduce((sum, refund) => sum + refund.amount, 0)
  const netPayments = totalPayments - totalRefunds

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin">
                <div className="flex items-center">
                  <Building className="h-8 w-8 text-blue-600" />
                  <span className="ml-2 text-xl font-bold text-gray-900">NMS Zazzau Properties - Admin</span>
                </div>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin/customers">
                <Button variant="default">Customers</Button>
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
          <div className="flex items-center mb-8">
            <Link href="/admin/customers">
              <Button variant="outline" size="sm" className="mr-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">Customer Profile</h1>
          </div>

          {/* Overpayment Alert */}
          {overpayments.length > 0 && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center text-orange-800">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Overpayment Detected
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {overpayments.map((overpayment, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm text-orange-700">
                        {overpayment.propertyTitle}: Overpaid by ₦{overpayment.overpaidAmount.toLocaleString()}
                      </span>
                      <Link
                        href={`/admin/refunds?customerId=${customerId}&propertyTitle=${overpayment.propertyTitle}&amount=${overpayment.overpaidAmount}`}
                      >
                        <Button size="sm" variant="outline" className="text-orange-700 border-orange-300">
                          Process Refund
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Info */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-blue-600 font-bold text-lg">{customer.name.charAt(0).toUpperCase()}</span>
                    </div>
                    {customer.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {customer.email && (
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">{customer.email}</span>
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm">{customer.phone}</span>
                    </div>
                  )}
                  {customer.address && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                      <span className="text-sm">{customer.address}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Financial Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Properties</span>
                    <span className="font-medium">{customer.properties.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Payments</span>
                    <span className="font-medium">₦{totalPayments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Refunds</span>
                    <span className="font-medium text-red-600">₦{totalRefunds.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-sm text-gray-600">Net Amount</span>
                    <span className="font-medium">₦{netPayments.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Properties and Payments */}
            <div className="lg:col-span-2 space-y-6">
              {/* Properties */}
              <Card>
                <CardHeader>
                  <CardTitle>Properties ({customer.properties.length})</CardTitle>
                  <CardDescription>Properties owned by this customer</CardDescription>
                </CardHeader>
                <CardContent>
                  {customer.properties.length > 0 ? (
                    <div className="space-y-4">
                      {customer.properties.map((property) => (
                        <div key={property.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium">{property.title}</h3>
                            <Badge variant="outline">₦{property.price.toLocaleString()}</Badge>
                          </div>
                          <div className="text-sm text-gray-600 space-y-1">
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {property.location}
                            </div>
                            {property.size && <div>Size: {property.size}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No properties recorded for this customer</div>
                  )}
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <CardTitle>Payment History ({payments.length})</CardTitle>
                  <CardDescription>All payments made by this customer</CardDescription>
                </CardHeader>
                <CardContent>
                  {payments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
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
                            <TableCell>{payment.propertyTitle}</TableCell>
                            <TableCell>₦{payment.amount.toLocaleString()}</TableCell>
                            <TableCell>
                              <Badge variant={payment.status === "Completed" ? "default" : "secondary"}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{payment.batchId || "N/A"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8 text-gray-500">No payments recorded for this customer</div>
                  )}
                </CardContent>
              </Card>

              {/* Refund History */}
              {refunds.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Refund History ({refunds.length})</CardTitle>
                    <CardDescription>All refunds processed for this customer</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Reason</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {refunds.map((refund) => (
                          <TableRow key={refund.id}>
                            <TableCell>{new Date(refund.date).toLocaleDateString()}</TableCell>
                            <TableCell>{refund.propertyTitle}</TableCell>
                            <TableCell className="text-red-600">₦{refund.amount.toLocaleString()}</TableCell>
                            <TableCell>{refund.reason}</TableCell>
                            <TableCell>
                              <Badge variant={refund.status === "Completed" ? "default" : "secondary"}>
                                {refund.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
