'use client'

import React, { useState } from 'react'
import { MessageSquare, X, Send, Bot, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ChatMessage {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
}

export function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: 'سلام! من دستیار هوشمند سیستم بازرسی هستم. چطور می‌تونم کمکتون کنم؟',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isTyping, setIsTyping] = useState(false)

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsTyping(true)

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: generateAIResponse(inputValue),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, aiMessage])
      setIsTyping(false)
    }, 1500)
  }

  const generateAIResponse = (userInput: string): string => {
    const responses = [
      'برای پاسخ به سوال شما، لطفاً اطلاعات بیشتری ارائه دهید.',
      'می‌توانم در زمینه‌های بازرسی تجهیزات، گزارش‌گیری و برنامه‌ریزی نگهداری کمک کنم.',
      'آیا نیاز به راهنمایی در مورد فرآیند بازرسی خاصی دارید؟',
      'برای دسترسی به اطلاعات تکمیلی، می‌توانید از منوی اصلی استفاده کنید.',
      'در صورت نیاز به گزارش‌گیری پیشرفته، بخش گزارشات حرفه‌ای را بررسی کنید.'
    ]
    return responses[Math.floor(Math.random() * responses.length)]
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chat Toggle Button */}
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => setIsOpen(true)}
        className="relative rounded-[var(--radius-field)]"
        aria-label="Open AI Chat"
      >
        <MessageSquare className="h-5 w-5 text-[var(--color-base-content)]" />
        <Badge 
          className="absolute -top-1 -right-1 h-3 w-3 p-0 bg-[var(--color-success)] text-[var(--color-success-content)] text-xs flex items-center justify-center rounded-full"
        >
          <span className="sr-only">AI available</span>
        </Badge>
      </Button>

      {/* Chat Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Chat Window */}
          <Card className="relative w-96 h-[500px] flex flex-col bg-[var(--color-base-100)] border-[var(--border)] shadow-[var(--depth)] rounded-[var(--radius-box)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b border-[var(--color-base-300)]">
              <CardTitle className="text-lg font-semibold text-[var(--color-base-content)] flex items-center gap-2">
                <Bot className="h-5 w-5 text-[var(--color-primary)]" />
                دستیار هوشمند
              </CardTitle>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-[var(--radius-selector)]"
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col p-0">
              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.type === 'ai' && (
                        <div className="w-8 h-8 rounded-[var(--radius-selector)] bg-[var(--color-primary)] text-[var(--color-primary-content)] flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4" />
                        </div>
                      )}
                      
                      <div
                        className={`max-w-[80%] p-3 rounded-[var(--radius-field)] text-sm ${
                          message.type === 'user'
                            ? 'bg-[var(--color-primary)] text-[var(--color-primary-content)]'
                            : 'bg-[var(--color-base-200)] text-[var(--color-base-content)]'
                        }`}
                      >
                        {message.content}
                      </div>
                      
                      {message.type === 'user' && (
                        <div className="w-8 h-8 rounded-[var(--radius-selector)] bg-[var(--color-secondary)] text-[var(--color-secondary-content)] flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isTyping && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-[var(--radius-selector)] bg-[var(--color-primary)] text-[var(--color-primary-content)] flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="bg-[var(--color-base-200)] text-[var(--color-base-content)] p-3 rounded-[var(--radius-field)] text-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-[var(--color-base-content)]/50 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-[var(--color-base-content)]/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-[var(--color-base-content)]/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              
              {/* Input Area */}
              <div className="p-4 border-t border-[var(--color-base-300)]">
                <div className="flex gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="پیام خود را بنویسید..."
                    className="flex-1 text-right"
                    dir="rtl"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isTyping}
                    size="icon"
                    className="rounded-[var(--radius-field)]"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}