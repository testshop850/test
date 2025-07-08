"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Star, Plus, Search, MessageSquare, Send } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"
import { useCart } from "@/contexts/cart-context"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface MenuItem {
  id: number
  name_uz: string
  name_ru: string
  name_en: string
  description_uz: string
  description_ru: string
  description_en: string
  price: number
  image_url: string
  category_name_uz: string
  category_name_ru: string
  category_name_en: string
  category_id: number
}

interface Category {
  id: number
  name_uz: string
  name_ru: string
  name_en: string
}

interface Review {
  id: number
  user_name: string
  rating: number
  comment: string
  created_at: string
}

interface MenuItemWithReviews extends MenuItem {
  averageRating: number
  totalReviews: number
  reviews: Review[]
}

export default function MenuPage() {
  const { language, t } = useLanguage()
  const { addToCart } = useCart()
  const { user } = useAuth()
  const { toast } = useToast()
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [selectedItem, setSelectedItem] = useState<MenuItemWithReviews | null>(null)
  const [userRating, setUserRating] = useState(0)
  const [userComment, setUserComment] = useState("")
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  useEffect(() => {
    fetchMenuData()
  }, [])

  const fetchMenuData = async () => {
    try {
      const [menuResponse, categoriesResponse] = await Promise.all([
        fetch("/api/menu"),
        fetch("/api/categories")
      ])

      let fetchedMenu: MenuItem[] = []
      if (menuResponse.ok) {
        const data = await menuResponse.json()
        fetchedMenu = data.menuItems || []
      }

      let fetchedCategories: Category[] = []
      if (categoriesResponse.ok) {
        const data = await categoriesResponse.json()
        fetchedCategories = data.categories || []
      }

      setMenuItems(fetchedMenu)
      setCategories(fetchedCategories)
    } catch (err) {
      console.error("Fetch error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchItemReviews = async (itemId: number) => {
    try {
      const response = await fetch(`/api/reviews?menuItemId=${itemId}`)
      if (response.ok) {
        const data = await response.json()
        return {
          reviews: data.reviews || [],
          averageRating: data.averageRating || 0,
          totalReviews: data.totalReviews || 0
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    }
    return { reviews: [], averageRating: 0, totalReviews: 0 }
  }

  const handleItemClick = async (item: MenuItem) => {
    const reviewData = await fetchItemReviews(item.id)
    setSelectedItem({
      ...item,
      ...reviewData
    })
  }

  const handleSubmitReview = async () => {
    if (!user) {
      toast({
        title: t("error"),
        description: "Sharh qoldirish uchun tizimga kiring",
        variant: "destructive",
      })
      return
    }

    if (userRating === 0) {
      toast({
        title: t("error"),
        description: "Iltimos, baho bering",
        variant: "destructive",
      })
      return
    }

    setIsSubmittingReview(true)

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          menuItemId: selectedItem?.id,
          rating: userRating,
          comment: userComment.trim() || null
        }),
      })

      if (response.ok) {
        toast({
          title: t("success"),
          description: "Sharhingiz qo'shildi!",
        })
        setUserRating(0)
        setUserComment("")
        // Refresh reviews
        if (selectedItem) {
          const reviewData = await fetchItemReviews(selectedItem.id)
          setSelectedItem({
            ...selectedItem,
            ...reviewData
          })
        }
      } else {
        const errorData = await response.json()
        toast({
          title: t("error"),
          description: errorData.error || "Sharh qo'shishda xatolik",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("error"),
        description: "Server bilan bog'lanishda xatolik",
        variant: "destructive",
      })
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const getLocalizedText = (item: any, field: string) => {
    return item[`${field}_${language}`] || item[`${field}_uz`] || ""
  }

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = selectedCategory === null || item.category_id === selectedCategory
    const matchesSearch = getLocalizedText(item, "name").toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("uz-UZ").format(price) + " so'm"
  }

  const renderStars = (rating: number, interactive = false, onStarClick?: (rating: number) => void) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-5 w-5 ${
              star <= rating 
                ? "fill-yellow-400 text-yellow-400" 
                : "text-gray-300"
            } ${interactive ? "cursor-pointer hover:text-yellow-400" : ""}`}
            onClick={() => interactive && onStarClick && onStarClick(star)}
          />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <Header />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t("loading")}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">{t("ourMenu")}</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Bizning ehtiyot bilan tayyorlangan mazali taomlarimizni kashf eting
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col space-y-4">
            {/* Search */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder={t("search")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={selectedCategory === null ? "default" : "outline"}
                onClick={() => setSelectedCategory(null)}
                className={`text-sm ${selectedCategory === null ? "bg-orange-600 hover:bg-orange-700" : ""}`}
              >
                {t("all")}
              </Button>
              {categories.map((category) => (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`text-sm ${selectedCategory === category.id ? "bg-orange-600 hover:bg-orange-700" : ""}`}
                >
                  {getLocalizedText(category, "name")}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
              onClick={() => handleItemClick(item)}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img
                    src={item.image_url || "/placeholder.svg?height=200&width=300"}
                    alt={getLocalizedText(item, "name")}
                    className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold">4.8</span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{getLocalizedText(item, "name")}</h3>
                    <p className="text-gray-600 text-sm line-clamp-2">{getLocalizedText(item, "description")}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold text-orange-600">{formatPrice(item.price)}</div>
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        addToCart({
                          id: item.id,
                          name: getLocalizedText(item, "name"),
                          price: item.price,
                          image_url: item.image_url,
                        })
                      }}
                      className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-full px-3 py-1 transition-all duration-300 hover:shadow-lg"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      {t("addToCart")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">{t("noResults")}</p>
          </div>
        )}
      </div>

      {/* Item Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {selectedItem && getLocalizedText(selectedItem, "name")}
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-6">
              {/* Item Image and Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedItem.image_url || "/placeholder.svg"}
                    alt={getLocalizedText(selectedItem, "name")}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                </div>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xl font-bold mb-2">{getLocalizedText(selectedItem, "name")}</h3>
                    <p className="text-gray-600">{getLocalizedText(selectedItem, "description")}</p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatPrice(selectedItem.price)}
                    </div>
                    <div className="flex items-center space-x-2">
                      {renderStars(selectedItem.averageRating)}
                      <span className="text-sm text-gray-600">
                        ({selectedItem.totalReviews} sharh)
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={() => {
                      addToCart({
                        id: selectedItem.id,
                        name: getLocalizedText(selectedItem, "name"),
                        price: selectedItem.price,
                        image_url: selectedItem.image_url,
                      })
                    }}
                    className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t("addToCart")}
                  </Button>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Sharhlar va baholar
                </h3>

                {/* Add Review */}
                {user && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h4 className="font-semibold mb-3">Sharh qoldiring</h4>
                    <div className="space-y-3">
                      <div>
                        <Label>Baho bering:</Label>
                        <div className="mt-1">
                          {renderStars(userRating, true, setUserRating)}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="comment">Sharh (ixtiyoriy):</Label>
                        <Textarea
                          id="comment"
                          value={userComment}
                          onChange={(e) => setUserComment(e.target.value)}
                          placeholder="Mahsulot haqida fikringizni yozing..."
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={handleSubmitReview}
                        disabled={isSubmittingReview || userRating === 0}
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <Send className="h-4 w-4 mr-2" />
                        {isSubmittingReview ? "Yuborilmoqda..." : "Sharh yuborish"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Reviews List */}
                <div className="space-y-4">
                  {selectedItem.reviews.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">
                      Hali sharhlar yo'q. Birinchi bo'lib sharh qoldiring!
                    </p>
                  ) : (
                    selectedItem.reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{review.user_name}</p>
                            {renderStars(review.rating)}
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.created_at).toLocaleDateString("uz-UZ")}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-gray-700">{review.comment}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}