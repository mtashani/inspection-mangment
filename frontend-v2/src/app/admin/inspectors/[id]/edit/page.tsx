'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { InspectorForm } from '@/components/admin/inspectors/inspector-form'
import { getInspectorById } from '@/lib/api/admin/inspectors'
import { Inspector } from '@/types/admin'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export default function EditInspectorPage() {
  const params = useParams()
  const inspectorId = parseInt(params.id as string)
  const [inspector, setInspector] = useState<Inspector | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInspector = async () => {
      try {
        setLoading(true)
        const data = await getInspectorById(inspectorId)
        setInspector(data)
      } catch (err) {
        console.error('Error fetching inspector:', err)
        setError('Failed to load inspector data')
        toast.error('Failed to load inspector data')
      } finally {
        setLoading(false)
      }
    }

    if (inspectorId) {
      fetchInspector()
    }
  }, [inspectorId])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Inspector</h1>
          <p className="text-muted-foreground">
            Loading inspector data...
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span>Loading inspector data...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !inspector) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Inspector</h1>
          <p className="text-muted-foreground">
            There was an error loading the inspector.
          </p>
        </div>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-destructive mb-2">
              {error || 'Inspector not found'}
            </h2>
            <p className="text-muted-foreground">
              The inspector you're looking for could not be loaded.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Edit Inspector: {inspector.name}</h1>
        <p className="text-muted-foreground">
          Update inspector information and specialties.
        </p>
      </div>
      <InspectorForm inspector={inspector} />
    </div>
  )
}