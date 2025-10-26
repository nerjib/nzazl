"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Pagination } from 'antd';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Plus, Eye, LogOut } from "lucide-react"
import axios from "axios"
import { customBaseUrl } from "@/lib/https"

export default function AdminCustomersPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [customers, setCustomers] = useState([])
  const [stat, setStat] = useState([]);
  const [paginatedUser, setPaginatedUsers] = useState([]);
  const [pagination, setPagination] = useState({
    size: 20,
    page: 1
  })
  const [ippisSearchTerm, setIppisSearchTerm] = useState("");
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

   
    const savedCustomers = localStorage.getItem("customers")
    if (savedCustomers) {
      setCustomers(JSON.parse(savedCustomers))
    }
    getCustomer();
    getStat();
  }, [router, ippisSearchTerm])

  const  getCustomer = async () => {
    if (ippisSearchTerm.trim() !== "") {
      // If there's an active IPPIS search, do not fetch all customers
      return;
    }
    const res = await axios.get(`${customBaseUrl.baseUrl}/api/v1/customers/all`)

    if(res.data.status) {
      setCustomers(res.data.data);
      const startIndex = (pagination.page - 1) * pagination.size;
      const endIndex = startIndex + pagination.size;
      const paginatedCustomers = res.data.data.slice(startIndex, endIndex);
      setPaginatedUsers(paginatedCustomers)
    }
  }

  const handlePagination = (page, size) => {
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;
    const paginatedCustomers = customers.slice(startIndex, endIndex);
    setPagination({ page, size });
    setPaginatedUsers(paginatedCustomers);
  }
  const  getStat = async () => {
    const res = await axios.get(`${customBaseUrl.baseUrl}/api/v1/customers/stats`);
    if(res.data.status){
      setStat(res.data.data)
    }
  }

  const handleIppisSearch = async () => {
    if (ippisSearchTerm.trim() === "") {
      // If search term is empty, fetch all customers
      getCustomer();
      return;
    }
    try {
      const res = await axios.get(`${customBaseUrl.baseUrl}/api/v1/payments/single/customer/${ippisSearchTerm}`);
      if (res.data.status) {
        setCustomers(res.data.data); // Assuming the API returns a single customer object
        setPaginatedUsers(res.data.data);
      } else {
        setCustomers([]);
        setPaginatedUsers([]);
      }
    } catch (error) {
      console.error("Error fetching customer by IPPIS:", error);
      setCustomers([]);
      setPaginatedUsers([]);
    }
  };

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
              <Link href="/admin">
                <div className="flex items-center">
                <img src="/zazzauIcon.png" alt="Zazzau Logo" className="h-8 w-8" />
                <span className="ml-2 text-xl font-bold text-gray-900">NMS Zazzau Properties - Admin</span>
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
                  <CardTitle>All Customers ({stat.allCustomers})</CardTitle>
                  <CardDescription>Manage your customer database</CardDescription>
                  <div className="flex items-center space-x-2">
                    <Input
                      placeholder="Search by IPPIS"
                      className="max-w-sm"
                      value={ippisSearchTerm}
                      onChange={(e) => setIppisSearchTerm(e.target.value)}
                    />
                    <Button onClick={handleIppisSearch}>Search</Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>IPPIS</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Address</TableHead>
                        {/* <TableHead>Properties</TableHead> */}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedUser.map((customer) => (
                        <TableRow key={customer.id}>
                          <TableCell className="font-medium">{customer.name}</TableCell>
                          <TableCell>{customer.ippis}</TableCell>
                          <TableCell>{customer.phoneNumber}</TableCell>
                          <TableCell>{customer.site}</TableCell>
                          {/* <TableCell>{customer.properties.length}</TableCell> */}
                          <TableCell>
                            <Link href={`/admin/customers/${customer.ippis}`}>
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
                  <Pagination
                    defaultCurrent={pagination.page} total={stat.allCustomers}
                    onChange={(page, size)=>{ 
                      setPagination({ ...pagination, page, size })
                      handlePagination(page, size)
                    }}
                  />
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
