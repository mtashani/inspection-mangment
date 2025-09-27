'use client'

import { Suspense } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { BulkOperationsContainer } from '@/components/admin/bulk-operations/bulk-operations-container'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

function BulkOperationsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <Skeleton className="h-8 w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BulkOperationsPage() {
  return (
    <DashboardLayout 
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Admin Panel', href: '/admin' },
        { label: 'Bulk Operations', current: true }
      ]}
    >
      <Suspense fallback={<BulkOperationsLoading />}>
        <BulkOperationsContainer />
      </Suspense>
    </DashboardLayout>
  )
}