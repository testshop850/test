"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { 
  ShoppingBag, 
  Users, 
  Eye, 
  Check, 
  Clock, 
  CheckCircle, 
  RefreshCw, 
  TrendingUp,
  Calendar,
  MapPin,
  Phone,
  Mail,
  DollarSign,
  Package,
  AlertCircle,
  Star,
  Filter,
  Search,
  Download,
  BarChart3,
  MessageSquare,
  HelpCircle,
  Settings
} from "lucide-react"

interface Order {
  id: number
  user_name?: string
  user_email?: string
  total_amount: number
  status: string
  delivery_address: string
  phone: string
  created_at: string
  items: any[]
  notes?: string
  payment_method?: string
}

interface User {
  id: number
  name: string
  email: string
  phone?: string
  created_at: string
  is_admin: boolean
}

interface Analytics {
  totalRevenue: number
  totalOrders: number
  totalUsers: number
  averageOrderValue: number
  revenueByPeriod: Array<{date: string, revenue: number}>
  ordersByStatus: Array<{status: string, count: number}>
  topProducts: Array<{name: string, total_sold: number, total_revenue: number}>
}

interface SupportTicket {
  id: number
  user_name: string
  user_email: string
  subject: string
  message: string
  status: string
  priority: string
  created_at: string
}

export default function AdminPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [orders, setOrders] = useState<Order[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState("dashboard")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFilter, setDateFilter] = useState("month")
  const { toast } = useToast()

  useEffect(() => {
    checkAdminAccess()
  }, [user])

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData()
      const interval = setInterval(fetchAllData, 30000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated, dateFilter])

  const checkAdminAccess = async () => {
    if (!user) {
      return
    }

    try {
      const response = await fetch("/api/admin/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email })
      })
      
      const data = await response.json()
      if (data.isAdmin) {
        setIsAuthenticated(true)
      } else {
        toast({
          title: "Kirish rad etildi",
          description: "Sizda admin huquqlari yo'q",
          variant: "destructive",
        })
        router.push("/")
      }
    } catch (error) {
      console.error("Admin check error:", error)
    }
  }

  const handleLogin = async () => {
    if (email !== "devolper2011@gmail.com") {
      toast({
        title: "Kirish rad etildi",
        description: "Faqat devolper2011@gmail.com admin hisobiga kirishi mumkin",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user.is_admin) {
          setIsAuthenticated(true)
          toast({
            title: "Muvaffaqiyatli",
            description: "Admin paneliga xush kelibsiz!",
          })
        } else {
          toast({
            title: "Kirish rad etildi",
            description: "Sizda admin huquqlari yo'q",
            variant: "destructive",
          })
        }
      } else {
        toast({
          title: "Xato",
          description: "Noto'g'ri email yoki parol",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Xato",
        description: "Server bilan bog'lanishda xatolik",
        variant: "destructive",
      })
    }
  }

  const fetchAllData = async () => {
    await Promise.all([
      fetchOrders(),
      fetchUsers(),
      fetchAnalytics(),
      fetchSupportTickets()
    ])
  }

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/orders")
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error("Error fetching orders:", error)
    }
  }

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users")
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
      }
    } catch (error) {
      console.error("Error fetching users:", error)
    }
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?period=${dateFilter}`)
      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error("Error fetching analytics:", error)
    }
  }

  const fetchSupportTickets = async () => {
    try {
      const response = await fetch("/api/support")
      if (response.ok) {
        const data = await response.json()
        setSupportTickets(data.tickets || [])
      }
    } catch (error) {
      console.error("Error fetching support tickets:", error)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchAllData()
    setIsRefreshing(false)
    toast({
      title: "Yangilandi",
      description: "Barcha ma'lumotlar yangilandi",
    })
  }

  const updateOrderStatus = async (orderId: number, status: string) => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        toast({
          title: "Muvaffaqiyatli",
          description: `Buyurtma holati ${getStatusText(status)} ga o'zgartirildi`,
        })
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === orderId ? { ...order, status } : order
          )
        )
        fetchOrders()
      }
    } catch (error) {
      toast({
        title: "Xato",
        description: "Buyurtma holatini o'zgartirishda xatolik",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price) + " so'm"
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "confirmed": return "bg-blue-100 text-blue-800 border-blue-200"
      case "delivered": return "bg-green-100 text-green-800 border-green-200"
      default: return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending": return "Yangi buyurtma"
      case "confirmed": return "Tasdiqlandi"
      case "delivered": return "Yakunlangan"
      default: return status
    }
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case "pending": return "confirmed"
      case "confirmed": return "delivered"
      default: return null
    }
  }

  const getNextStatusText = (currentStatus: string) => {
    const nextStatus = getNextStatus(currentStatus)
    return nextStatus ? getStatusText(nextStatus) : null
  }

  const filterOrdersByStatus = (status: string) => {
    let filtered = orders
    
    switch (status) {
      case "pending":
        filtered = orders.filter(order => order.status === "pending")
        break
      case "completed":
        filtered = orders.filter(order => order.status === "delivered")
        break
      default:
        filtered = orders
    }

    if (searchQuery) {
      filtered = filtered.filter(order => 
        order.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.phone.includes(searchQuery) ||
        order.id.toString().includes(searchQuery)
      )
    }

    return filtered
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center mb-4">
                <Settings className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">🔐 Admin Panel</CardTitle>
              <p className="text-gray-600">Milano Cafe boshqaruv tizimi</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="devolper2011@gmail.com"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="password">Parol</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleLogin()}
                  className="mt-1"
                />
              </div>
              <Button 
                onClick={handleLogin} 
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
              >
                Kirish
              </Button>
              <p className="text-sm text-gray-500 text-center">
                Faqat devolper2011@gmail.com admin hisobiga kirishi mumkin
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header />
        <div className="flex items-center justify-center min-h-[80vh] px-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Kirish rad etildi</h2>
              <p className="text-gray-600 mb-4">Sizda admin huquqlari yo'q</p>
              <Button onClick={() => router.push("/")} variant="outline">
                Bosh sahifaga qaytish
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  const pendingOrders = filterOrdersByStatus("pending")
  const completedOrders = filterOrdersByStatus("completed")

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Header Section */}
        <div className="mb-6 md:mb-8 flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              🏪 Milano Cafe Admin Dashboard
            </h1>
            <p className="text-gray-600">Zamonaviy boshqaruv paneli</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Yangilash</span>
            </Button>
            <Button variant="outline" className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-green-500">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">Jami daromad</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">
                      {formatPrice(analytics.totalRevenue)}
                    </p>
                    <p className="text-xs text-green-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +15% bu oy
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-orange-500">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">Jami buyurtmalar</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">{analytics.totalOrders}</p>
                    <p className="text-xs text-orange-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +8% bu hafta
                    </p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <ShoppingBag className="h-6 w-6 md:h-8 md:w-8 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-blue-500">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">Foydalanuvchilar</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">{analytics.totalUsers}</p>
                    <p className="text-xs text-blue-600 flex items-center mt-1">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      +12% bu oy
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 border-l-4 border-l-purple-500">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600">O'rtacha buyurtma</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900">
                      {formatPrice(analytics.averageOrderValue)}
                    </p>
                    <p className="text-xs text-purple-600 flex items-center mt-1">
                      <BarChart3 className="h-3 w-3 mr-1" />
                      Statistika
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <BarChart3 className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard">📊 Dashboard</TabsTrigger>
            <TabsTrigger value="orders">📋 Buyurtmalar</TabsTrigger>
            <TabsTrigger value="users">👥 Foydalanuvchilar</TabsTrigger>
            <TabsTrigger value="support">🎧 Yordam</TabsTrigger>
            <TabsTrigger value="analytics">📈 Analitika</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>📊 Tezkor ko'rsatkichlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                      <span className="text-gray-600">Yangi buyurtmalar:</span>
                      <span className="font-semibold text-yellow-600">{pendingOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="text-gray-600">Yakunlangan:</span>
                      <span className="font-semibold text-green-600">{completedOrders.length}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-600">Yordam so'rovlari:</span>
                      <span className="font-semibold text-blue-600">{supportTickets.length}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>🏆 Top mahsulotlar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics?.topProducts.slice(0, 5).map((product, index) => (
                      <div key={index} className="flex justify-between items-center p-2 border-b">
                        <span className="font-medium">{product.name}</span>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{product.total_sold} dona</div>
                          <div className="text-xs text-gray-500">{formatPrice(product.total_revenue)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            {/* Orders content - similar to existing but enhanced */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Buyurtma, mijoz yoki telefon bo'yicha qidirish..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="pending" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pending">🆕 Yangi ({pendingOrders.length})</TabsTrigger>
                <TabsTrigger value="completed">✅ Yakunlangan ({completedOrders.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="pending">
                <OrdersList
                  orders={pendingOrders}
                  onUpdateStatus={updateOrderStatus}
                  onViewOrder={setSelectedOrder}
                  isLoading={isLoading}
                  formatPrice={formatPrice}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  getNextStatusText={getNextStatusText}
                  getNextStatus={getNextStatus}
                />
              </TabsContent>

              <TabsContent value="completed">
                <OrdersList
                  orders={completedOrders}
                  onUpdateStatus={updateOrderStatus}
                  onViewOrder={setSelectedOrder}
                  isLoading={isLoading}
                  formatPrice={formatPrice}
                  getStatusColor={getStatusColor}
                  getStatusText={getStatusText}
                  getNextStatusText={getNextStatusText}
                  getNextStatus={getNextStatus}
                  showActions={false}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>Ro'yxatdan o'tgan foydalanuvchilar</span>
                  {users.length > 0 && <Badge className="bg-blue-100 text-blue-800">{users.length}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Hali foydalanuvchilar yo'q</p>
                    </div>
                  ) : (
                    users.map((user) => (
                      <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center">
                                <Users className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 flex items-center">
                                  {user.name}
                                  {user.is_admin && (
                                    <Badge className="ml-2 bg-red-100 text-red-800">Admin</Badge>
                                  )}
                                </p>
                                <p className="text-sm text-gray-600 flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {user.email}
                                </p>
                                {user.phone && (
                                  <p className="text-sm text-gray-600 flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {user.phone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600 flex items-center justify-end">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(user.created_at).toLocaleDateString("uz-UZ")}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="support">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <HelpCircle className="h-5 w-5" />
                  <span>Yordam so'rovlari</span>
                  {supportTickets.length > 0 && (
                    <Badge className="bg-blue-100 text-blue-800">{supportTickets.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supportTickets.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Hali yordam so'rovlari yo'q</p>
                    </div>
                  ) : (
                    supportTickets.map((ticket) => (
                      <div key={ticket.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                          <div className="flex space-x-2">
                            <Badge className={
                              ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                              ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }>
                              {ticket.priority}
                            </Badge>
                            <Badge className={
                              ticket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }>
                              {ticket.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-2">{ticket.message}</p>
                        <div className="flex justify-between items-center text-sm text-gray-500">
                          <span>{ticket.user_name} ({ticket.user_email})</span>
                          <span>{new Date(ticket.created_at).toLocaleDateString("uz-UZ")}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">📈 Batafsil analitika</h2>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="day">Bugun</option>
                  <option value="week">Bu hafta</option>
                  <option value="month">Bu oy</option>
                  <option value="year">Bu yil</option>
                </select>
              </div>

              {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>💰 Daromad dinamikasi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.revenueByPeriod.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border-b">
                            <span>{new Date(item.date).toLocaleDateString("uz-UZ")}</span>
                            <span className="font-semibold">{formatPrice(item.revenue)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>📊 Buyurtmalar holati</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {analytics.ordersByStatus.map((item, index) => (
                          <div key={index} className="flex justify-between items-center p-2 border-b">
                            <span>{getStatusText(item.status)}</span>
                            <span className="font-semibold">{item.count}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Package className="h-5 w-5" />
              <span>Buyurtma tafsilotlari #{selectedOrder?.id}</span>
              <Badge className={selectedOrder ? getStatusColor(selectedOrder.status) : ""}>
                {selectedOrder ? getStatusText(selectedOrder.status) : ""}
              </Badge>
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Mijoz ma'lumotlari
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold">{selectedOrder.user_name || "Mehmon"}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{selectedOrder.phone}</span>
                    </div>
                    {selectedOrder.user_email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{selectedOrder.user_email}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Yetkazish ma'lumotlari
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span>{selectedOrder.delivery_address}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-4 w-4 text-gray-400" />
                      <span className="font-semibold text-orange-600">
                        {formatPrice(selectedOrder.total_amount)}
                      </span>
                    </div>
                    {selectedOrder.payment_method && (
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">
                          To'lov usuli: {selectedOrder.payment_method}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Buyurtma tarkibi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <span className="font-medium">{item.name || `Mahsulot ${item.menu_item_id}`}</span>
                          <div className="text-sm text-gray-600">
                            {item.quantity} x {formatPrice(item.price)}
                          </div>
                        </div>
                        <span className="font-semibold text-orange-600">
                          {formatPrice(item.quantity * item.price)}
                        </span>
                      </div>
                    ))}
                    <div className="border-t pt-3 flex justify-between items-center font-bold text-lg">
                      <span>Jami:</span>
                      <span className="text-orange-600">{formatPrice(selectedOrder.total_amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notes */}
              {selectedOrder.notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Qo'shimcha izohlar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700">{selectedOrder.notes}</p>
                  </CardContent>
                </Card>
              )}

              {/* Order Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    Buyurtma vaqti
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>Buyurtma berilgan: {new Date(selectedOrder.created_at).toLocaleString("uz-UZ")}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Enhanced Orders List Component
function OrdersList({
  orders,
  onUpdateStatus,
  onViewOrder,
  isLoading,
  formatPrice,
  getStatusColor,
  getStatusText,
  getNextStatusText,
  getNextStatus,
  showActions = true,
}: {
  orders: Order[]
  onUpdateStatus: (id: number, status: string) => void
  onViewOrder: (order: Order) => void
  isLoading: boolean
  formatPrice: (price: number) => string
  getStatusColor: (status: string) => string
  getStatusText: (status: string) => string
  getNextStatusText: (status: string) => string | null
  getNextStatus: (status: string) => string | null
  showActions?: boolean
}) {
  if (orders.length === 0) {
    return (
      <div className="text-center py-12">
        <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">Bu bo'limda buyurtmalar yo'q</p>
        <p className="text-sm text-gray-500 mt-2">Yangi buyurtmalar kelganda bu yerda ko'rinadi</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-all duration-200 hover:shadow-md">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-3 lg:space-y-0">
            <div className="flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <p className="font-semibold text-lg">📋 Buyurtma #{order.id}</p>
                    <Badge className={getStatusColor(order.status)}>{getStatusText(order.status)}</Badge>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {order.user_name || "Mehmon"}
                    </p>
                    <p className="flex items-center">
                      <Phone className="h-3 w-3 mr-1" />
                      {order.phone}
                    </p>
                    <p className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      <span className="truncate">{order.delivery_address}</span>
                    </p>
                    <p className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(order.created_at).toLocaleString("uz-UZ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="text-right">
                <p className="font-bold text-xl text-orange-600">{formatPrice(order.total_amount)}</p>
                <p className="text-sm text-gray-500">{order.items?.length || 0} mahsulot</p>
              </div>
              {showActions && (
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewOrder(order)}
                    className="bg-blue-50 hover:bg-blue-100 text-xs border-blue-200"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ko'rish
                  </Button>
                  {getNextStatus(order.status) && (
                    <Button
                      size="sm"
                      onClick={() => onUpdateStatus(order.id, getNextStatus(order.status)!)}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      {getNextStatusText(order.status)}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}