"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { HelpCircle, Send, MessageSquare } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"

export function SupportWidget() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState("medium")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!user) {
      toast({
        title: "Xato",
        description: "Yordam so'rash uchun tizimga kiring",
        variant: "destructive",
      })
      return
    }

    if (!subject.trim() || !message.trim()) {
      toast({
        title: "Xato",
        description: "Mavzu va xabar kiritilishi shart",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          subject: subject.trim(),
          message: message.trim(),
          priority
        }),
      })

      if (response.ok) {
        toast({
          title: "Muvaffaqiyatli",
          description: "Yordam so'rovingiz yuborildi. Tez orada javob beramiz!",
        })
        setSubject("")
        setMessage("")
        setPriority("medium")
        setIsOpen(false)
      } else {
        throw new Error("Failed to submit")
      }
    } catch (error) {
      toast({
        title: "Xato",
        description: "Yordam so'rovini yuborishda xatolik",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          className="fixed bottom-6 right-6 rounded-full w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg z-50"
          size="icon"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Yordam kabineti</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="subject">Mavzu</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Muammo haqida qisqacha yozing"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="priority">Muhimlik darajasi</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Past</SelectItem>
                <SelectItem value="medium">O'rta</SelectItem>
                <SelectItem value="high">Yuqori</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="message">Xabar</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Muammoni batafsil tasvirlab bering..."
              rows={4}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !subject.trim() || !message.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Send className="h-4 w-4 mr-2" />
            {isSubmitting ? "Yuborilmoqda..." : "Yordam so'rash"}
          </Button>

          {!user && (
            <p className="text-sm text-gray-500 text-center">
              Yordam so'rash uchun avval tizimga kiring
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}