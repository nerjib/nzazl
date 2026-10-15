"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Plus, Eye } from "lucide-react"

export default function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    propertyTitle: "",
    propertyLocation: "",
    propertySize: "",
    propertyPrice: "",
  })

  useEffect(() => {
    const savedCustomers = localStorage.getItem("customers")
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers))
    }
  }, [])

  const saveCustomers = (updatedCustomers) => {
    setCustomers(updatedCustomers)
    localStorage.setItem("customers", JSON.stringify(updatedCustomers))
  }

  const handleAddCustomer = (e) => {
    e.preventDefault()

    const customer = {
      id: Date.now().toString(),
      name: newCustomer.name,
      email: newCustomer.email,
      phone: newCustomer.phone,
      address: newCustomer.address,
      properties: newCustomer.propertyTitle
        ? [
            {
              id: Date.now().toString(),
              title: newCustomer.propertyTitle,
              location: newCustomer.propertyLocation,
              size: newCustomer.propertySize,
              price: Number.parseFloat(newCustomer.propertyPrice) || 0,
            },
          ]
        : [],
    }

    const updatedCustomers = [...customers, customer]
    saveCustomers(updatedCustomers)

    setNewCustomer({
      name: "",
      email: "",
      phone: "",
      address: "",
      propertyTitle: "",
      propertyLocation: "",
      propertySize: "",
      propertyPrice: "",
    })
  }

  const handleBulkUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const csv = event.target?.result
      const lines = csv.split("\n")
      const newCustomers = []

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map((v) => v.trim())
        if (values.length >= 4 && values[0]) {
          const customer = {
            id: Date.now().toString() + i,
            name: values[0] || "",
            email: values[1] || "",
            phone: values[2] || "",
            address: values[3] || "",
            properties: values[4]
              ? [
                  {
                    id: Date.now().toString() + i,
                    title: values[4] || "",
                    location: values[5] || "",
                    size: values[6] || "",
                    price: Number.parseFloat(values[7]) || 0,
                  },
                ]
              : [],
          }
          newCustomers.push(customer)
        }
      }

      const updatedCustomers = [...customers, ...newCustomers]
      saveCustomers(updatedCustomers)
    }

    reader.readAsText(file)
  }

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
                <Button variant="default">Customers</Button>
              </Link>
              <Link href="/payments">
                <Button variant="ghost">Payments</Button>
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
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Customer Management</h1>

          <Tabs defaultValue="list" className="space-y-6">
            <TabsList>
              <TabsTrigger value="list">Customer List</TabsTrigger>
              <TabsTrigger value="add">Add Customer</TabsTrigger>
              <TabsTrigger value="bulk">Bulk Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="list">
              <Card>
                <CardHeader>
                  <CardTitle>All Customers ({customers.length})</CardTitle>
                  <CardDescription>Manage your customer database</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Properties</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customers.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{customer.properties.length}</TableCell>
                          <TableCell>
                            <Link href={`/customers/view?id=${customer.id}`}>
                              <Button size="sm" variant="outline">
                                <Eye className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </Link>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {customers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No customers found. Add your first customer to get started.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="add">
              <Card>
                <CardHeader>
                  <CardTitle>Add New Customer</CardTitle>
                  <CardDescription>Enter customer details and their first property</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddCustomer} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          value={newCustomer.name}
                          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={newCustomer.email}
                          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={newCustomer.phone}
                          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Address</Label>
                      <Textarea
                        id="address"
                        value={newCustomer.address}
                        onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                      />
                    </div>

                    <div className="border-t pt-6">
                      <h3 className="text-lg font-medium mb-4">Property Information (Optional)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="propertyTitle">Property Title</Label>
                          <Input
                            id="propertyTitle"
                            value={newCustomer.propertyTitle}
                            onChange={(e) => setNewCustomer({ ...newCustomer, propertyTitle: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="propertyLocation">Location</Label>
                          <Input
                            id="propertyLocation"
                            value={newCustomer.propertyLocation}
                            onChange={(e) => setNewCustomer({ ...newCustomer, propertyLocation: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label htmlFor="propertySize">Size</Label>
                          <Input
                            id="propertySize"
                            value={newCustomer.propertySize}
                            onChange={(e) => setNewCustomer({ ...newCustomer, propertySize: e.target.value })}
                            placeholder="e.g., 500 sqm"
                          />
                        </div>
                        <div>
                          <Label htmlFor="propertyPrice">Price (₦)</Label>
                          <Input
                            id="propertyPrice"
                            type="number"
                            value={newCustomer.propertyPrice}
                            onChange={(e) => setNewCustomer({ ...newCustomer, propertyPrice: e.target.value })}
                          />
                        </div>
                      </div>
                    </div>

                    <Button type="submit" className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Customer
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bulk">
              <Card>
                <CardHeader>
                  <CardTitle>Bulk Upload Customers</CardTitle>
                  <CardDescription>
                    Upload a CSV file with customer data. Format: Name, Email, Phone, Address, Property Title, Property
                    Location, Property Size, Property Price
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
                        Name,Email,Phone,Address,Property Title,Property Location,Property Size,Property Price
                        <br />
                        John Doe,john@email.com,08012345678,123 Main St,Plot 1,Zaria,500 sqm,5000000
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
