import { Metadata } from 'next'
import { InspectorForm } from '@/components/admin/inspectors/inspector-form'

export const metadata: Metadata = {
  title: 'Create Inspector | Admin Panel',
  description: 'Create a new inspector in the system',
}

export default function CreateInspectorPage() {
  return (
    <div className="w-full h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create New Inspector</h1>
        <p className="text-muted-foreground mt-2">
          Add a new inspector to the system with their complete details.
        </p>
      </div>
      <InspectorForm />
    </div>
  )
}