'use client'
'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Calendar, 
  Badge, 
  User,
  Settings,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Award,
  Files
} from 'lucide-react'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge as UIBadge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { getInspectorById, deleteInspector } from '@/lib/api/admin/inspectors'
import { Inspector } from '@/types/admin'
import { InspectorRoleManagement } from '@/components/admin/inspectors/inspector-role-management'
import { toast } from 'sonner'

// Specialty-related constants removed - no longer used

export default function InspectorDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const inspectorId = parseInt(params.id as string)
  const activeTab = searchParams.get('tab') || 'overview'
  const [inspector, setInspector] = useState<Inspector | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Admin Panel', href: '/admin' },
    { label: 'Inspectors', href: '/admin/inspectors' },
    { label: inspector?.name || 'Inspector Details', href: `/admin/inspectors/${inspectorId}`, isActive: true }
  ]

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

  const handleDelete = async () => {
    if (!inspector) return

    try {
      setDeleting(true)
      await deleteInspector(inspector.id)
      toast.success('Inspector deleted successfully')
      router.push('/admin/inspectors')
    } catch (error) {
      console.error('Error deleting inspector:', error)
      toast.error('Failed to delete inspector. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inspector Details</h1>
            <p className="text-muted-foreground">
              Loading inspector information...
            </p>
          </div>
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Loading inspector details...</span>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (error || !inspector) {
    return (
      <DashboardLayout breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inspector Details</h1>
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
                The inspector you're looking for could not be found.
              </p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout breadcrumbs={breadcrumbs}>
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-muted flex items-center justify-center overflow-hidden bg-muted">
            {inspector.profileImageUrl ? (
              <img
                src={inspector.profileImageUrl}
                alt={inspector.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-8 h-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{inspector.name}</h1>
            <p className="text-muted-foreground">
              {inspector.employeeId}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/admin/inspectors/${inspector.id}/certificates`}>
              <Award className="w-4 h-4 mr-2" />
              Certificates
            </Link>
          </Button>
          
          <Button variant="outline" asChild>
            <Link href={`/admin/inspectors/${inspector.id}/documents`}>
              <Files className="w-4 h-4 mr-2" />
              Documents
            </Link>
          </Button>
          
          <Button asChild>
            <Link href={`/admin/inspectors/${inspector.id}/edit`}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Link>
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Inspector</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {inspector.name}? This action cannot be undone.
                  All associated data including attendance records and reports will be permanently removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Delete Inspector
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

        {/* Status Indicators */}
        <div className="flex items-center gap-4">
          <UIBadge variant={inspector.active ? "default" : "secondary"}>
            {inspector.active ? (
              <CheckCircle className="w-3 h-3 mr-1" />
            ) : (
              <XCircle className="w-3 h-3 mr-1" />
            )}
            {inspector.active ? 'Active' : 'Inactive'}
          </UIBadge>
          
          <UIBadge variant={inspector.canLogin ? "default" : "secondary"}>
            {inspector.canLogin ? 'Can Login' : 'No Login Access'}
          </UIBadge>
          
          <UIBadge variant={inspector.attendanceTrackingEnabled ? "default" : "secondary"}>
            {inspector.attendanceTrackingEnabled ? 'Attendance Tracked' : 'No Attendance Tracking'}
          </UIBadge>
        </div>

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={(value) => {
          const url = new URL(window.location.href)
          if (value === 'overview') {
            url.searchParams.delete('tab')
          } else {
            url.searchParams.set('tab', value)
          }
          router.push(url.pathname + url.search)
        }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="roles">Roles & Permissions</TabsTrigger>
            <TabsTrigger value="system">System Info</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <p className="text-sm text-muted-foreground">{inspector.email}</p>
                </div>
              </div>
              
              {inspector.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{inspector.phone}</p>
                  </div>
                </div>
              )}
              
              {inspector.dateOfBirth && (
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Date of Birth</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(inspector.dateOfBirth).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Years of Experience</p>
                  <p className="text-sm text-muted-foreground">{inspector.yearsExperience} years</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payroll Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Payroll Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {inspector.baseHourlyRate && (
                <div>
                  <p className="text-sm font-medium">Base Hourly Rate</p>
                  <p className="text-sm text-muted-foreground">
                    ${inspector.baseHourlyRate.toFixed(2)}/hour
                  </p>
                </div>
              )}
              
              {inspector.overtimeMultiplier && (
                <div>
                  <p className="text-sm font-medium">Overtime Multiplier</p>
                  <p className="text-sm text-muted-foreground">
                    {inspector.overtimeMultiplier}x
                  </p>
                </div>
              )}
              
              {!inspector.baseHourlyRate && !inspector.overtimeMultiplier && (
                <p className="text-sm text-muted-foreground">No payroll settings configured</p>
              )}
            </CardContent>
          </Card>
        </div>
          </TabsContent>

          <TabsContent value="roles" className="space-y-6">
            {/* Role Management */}
            <InspectorRoleManagement 
              inspectorId={inspector.id}
              inspectorName={inspector.name}
              onRolesChanged={() => {
                // Refresh inspector data if needed
                console.log('Roles updated for inspector:', inspector.id)
              }}
            />
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            {/* System Information */}
            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium">Created At</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(inspector.createdAt).toLocaleString()}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium">Last Updated</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(inspector.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {inspector.lastLoginAt && (
                    <div>
                      <p className="text-sm font-medium">Last Login</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(inspector.lastLoginAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}