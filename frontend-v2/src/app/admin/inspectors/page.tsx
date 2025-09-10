'use client'

import { InspectorList } from '@/components/admin/inspectors/inspector-list'

export default function InspectorsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Inspector Management</h1>
      <InspectorList />
    </div>
  )
}