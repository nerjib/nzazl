"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Building, Download, LogOut, Mail, Phone, MapPin, FileText } from "lucide-react"

export default function CustomerDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [customer, setCustomer] = useState(null)
  const [payments, setPayments] = useState([])
  const [refunds, setRefunds] = useState([])

  useEffect(() => {
    // Check authentication
    const session = localStorage.getItem("userSession")
    if (!session) {
      router.push("/login")
      return
    }

    const userData = JSON.parse(session)
    if (userData.role !== "customer") {
      router.push("/login")
      return
    }

    setUser(userData)

    // For demo purposes, create a sample customer if none exists
    const customers = JSON.parse(localStorage.getItem("customers") || "[]")
    let foundCustomer = customers.find((c) => c.email === userData.email)

    if (!foundCustomer) {
      // Create demo customer data
      foundCustomer = {
        id: "customer_123",
        name: userData.name,
        email: userData.email,
        phone: "+234 801 234 5678",
        address: "123 Ahmadu Bello Way, Zaria, Kaduna State",
        properties: [
          {
            id: "prop_1",
            title: "Residential Plot - Block A, Plot 15",
            location: "Sabon Gari, Zaria",
            size: "500 sqm",
            price: 2500000,
          },
          {
            id: "prop_2",
            title: "Commercial Plot - Block C, Plot 8",
            location: "City Centre, Zaria",
            size: "750 sqm",
            price: 4500000,
          },
        ],
      }

      customers.push(foundCustomer)
      localStorage.setItem("customers", JSON.stringify(customers))
    }

    setCustomer(foundCustomer)

    // Load or create demo payments
    const allPayments = JSON.parse(localStorage.getItem("payments") || "[]")
    let customerPayments = allPayments.filter((p) => p.customerId === foundCustomer.id)

    if (customerPayments.length === 0) {
      // Create demo payments
      const demoPayments = [
        {
          id: "pay_1",
          customerId: foundCustomer.id,
          customerName: foundCustomer.name,
          propertyTitle: "Residential Plot - Block A, Plot 15",
          amount: 1000000,
          date: "2024-01-15",
          status: "Completed",
          description: "Initial payment",
          batchId: "batch_jan_2024",
        },
        {
          id: "pay_2",
          customerId: foundCustomer.id,
          customerName: foundCustomer.name,
          propertyTitle: "Residential Plot - Block A, Plot 15",
          amount: 800000,
          date: "2024-02-15",
          status: "Completed",
          description: "Second installment",
          batchId: "batch_feb_2024",
        },
        {
          id: "pay_3",
          customerId: foundCustomer.id,
          customerName: foundCustomer.name,
          propertyTitle: "Commercial Plot - Block C, Plot 8",
          amount: 2000000,
          date: "2024-03-10",
          status: "Completed",
          description: "Down payment",
          batchId: "batch_mar_2024",
        },
      ]

      allPayments.push(...demoPayments)
      localStorage.setItem("payments", JSON.stringify(allPayments))
      customerPayments = demoPayments
    }

    setPayments(customerPayments)

    // Load refunds
    const allRefunds = JSON.parse(localStorage.getItem("refunds") || "[]")
    const customerRefunds = allRefunds.filter((r) => r.customerId === foundCustomer.id)
    setRefunds(customerRefunds)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("userSession")
    router.push("/")
  }

  const generatePDF = () => {
    if (!customer || !payments.length) return

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Record - ${customer.name}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #2563eb; padding-bottom: 20px; }
          .company-name { color: #2563eb; font-size: 24px; font-weight: bold; margin-bottom: 5px; }
          .document-title { font-size: 18px; color: #666; }
          .customer-info { margin: 20px 0; padding: 15px; background-color: #f8fafc; border-radius: 8px; }
          .info-row { display: flex; margin-bottom: 8px; }
          .info-label { font-weight: bold; width: 120px; }
          .properties-section, .payments-section { margin: 30px 0; }
          .section-title { font-size: 18px; font-weight: bold; color: #2563eb; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .property-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
          .property-title { font-weight: bold; font-size: 16px; margin-bottom: 8px; }
          .property-details { color: #666; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; }
          th { background-color: #f8fafc; font-weight: bold; }
          .amount { font-weight: bold; color: #059669; }
          .status-completed { background-color: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-size: 12px; }
          .summary { margin-top: 30px; padding: 20px; background-color: #f0f9ff; border-radius: 8px; }
          .summary-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; }
          .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">🏢 NMS Zazzau Properties</div>
          <div class="document-title">Payment Record & Property Information</div>
          <div style="margin-top: 10px; color: #666;">Generated on ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="customer-info">
          <h3 style="margin-top: 0; color: #2563eb;">Customer Information</h3>
          <div class="info-row">
            <span class="info-label">Name:</span>
            <span>${customer.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Email:</span>
            <span>${customer.email}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Phone:</span>
            <span>${customer.phone}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Address:</span>
            <span>${customer.address}</span>
          </div>
        </div>

        <div class="properties-section">
          <div class="section-title">Properties Owned</div>
          ${customer.properties
            .map(
              (property) => `
            <div class="property-card">
              <div class="property-title">${property.title}</div>
              <div class="property-details">
                <div><strong>Location:</strong> ${property.location}</div>
                <div><strong>Size:</strong> ${property.size}</div>
                <div><strong>Price:</strong> ₦${property.price.toLocaleString()}</div>
              </div>
            </div>
          `,
            )
            .join("")}
        </div>

        <div class="payments-section">
          <div class="section-title">Payment History</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Property</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              ${payments
                .map(
                  (payment) => `
                <tr>
                  <td>${new Date(payment.date).toLocaleDateString()}</td>
                  <td>${payment.propertyTitle}</td>
                  <td class="amount">₦${payment.amount.toLocaleString()}</td>
                  <td><span class="status-completed">${payment.status}</span></td>
                  <td>${payment.description}</td>
                </tr>
              `,
                )
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="summary">
          <div class="summary-title">Payment Summary</div>
          <div class="info-row">
            <span class="info-label">Total Payments:</span>
            <span class="amount">₦${payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Number of Transactions:</span>
            <span>${payments.length}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Properties Count:</span>
            <span>${customer.properties.length}</span>
          </div>
        </div>

        <div class="footer">
          <p>This document was generated electronically by NMS Zazzau Properties Management System.</p>
          <p>For inquiries, contact us at info@zazzauproperties.com | +234 (0) 123 456 7890</p>
        </div>
      </body>
      </html>
    `

    // Create and download PDF
    const blob = new Blob([htmlContent], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Payment_Record_${customer.name.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    // Note: In a real application, you would use a proper PDF generation library
    // like jsPDF, Puppeteer, or a server-side solution
  }

  if (!user || !customer) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
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
              <Building className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">NMS Zazzau Properties - Customer Portal</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.name}</span>
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
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Dashboard</h1>
            <Button onClick={generatePDF} className="bg-green-600 hover:bg-green-700">
              <Download className="h-4 w-4 mr-2" />
              Download Payment Record (PDF)
            </Button>
          </div>

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
                  <div className="flex items-center">
                    <Mail className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{customer.email}</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-sm">{customer.phone}</span>
                  </div>
                  <div className="flex items-start">
                    <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-0.5" />
                    <span className="text-sm">{customer.address}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Payment Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Properties Owned</span>
                    <span className="font-medium">{customer.properties.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Payments</span>
                    <span className="font-medium text-green-600">₦{totalPayments.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Transactions</span>
                    <span className="font-medium">{payments.length}</span>
                  </div>
                  {totalRefunds > 0 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Refunds</span>
                      <span className="font-medium text-red-600">₦{totalRefunds.toLocaleString()}</span>
                    </div>
                  )}
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
                  <CardTitle>My Properties ({customer.properties.length})</CardTitle>
                  <CardDescription>Properties you own with NMS Zazzau Properties</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customer.properties.map((property) => (
                      <div key={property.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-lg">{property.title}</h3>
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            ₦{property.price.toLocaleString()}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {property.location}
                          </div>
                          <div>Size: {property.size}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Payment History */}
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Payment History ({payments.length})</CardTitle>
                      <CardDescription>All your payment transactions</CardDescription>
                    </div>
                    <Button variant="outline" onClick={generatePDF} size="sm">
                      <FileText className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell>{new Date(payment.date).toLocaleDateString()}</TableCell>
                          <TableCell className="font-medium">{payment.propertyTitle}</TableCell>
                          <TableCell className="font-medium text-green-600">
                            ₦{payment.amount.toLocaleString()}
                          </TableCell>
                          <TableCell>
                            <Badge variant={payment.status === "Completed" ? "default" : "secondary"}>
                              {payment.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{payment.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Refund History */}
              {refunds.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Refund History ({refunds.length})</CardTitle>
                    <CardDescription>Refunds processed for your account</CardDescription>
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
                            <TableCell className="text-red-600 font-medium">
                              ₦{refund.amount.toLocaleString()}
                            </TableCell>
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
