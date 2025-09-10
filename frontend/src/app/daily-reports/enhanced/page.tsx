'use client'

import React from 'react'
import { EnhancedDailyReportsPage, ToastProvider } from '@/components/maintenance'

export default function EnhancedDailyReportsPageWrapper() {
  return (
    <ToastProvider>
      <div className="container mx-auto px-4 py-8">
        <EnhancedDailyReportsPage />
      </div>
    </ToastProvider>
  )
}