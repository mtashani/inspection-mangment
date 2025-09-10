'use client'

import { useAuth } from '@/contexts/auth-context'
import { useInspectors } from '@/contexts/inspectors-context'
import { AdminOnly, AccessDenied } from '@/components/auth/permission-guard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, Settings, FileSpreadsheet, Plus, Shield, Gift } from 'lucide-react'
import Link from 'next/link'
import { MonthlyAttendanceGrid } from '@/components/attendance/MonthlyAttendanceGrid'
import { useState } from 'react'

export default function AdminDashboard() {
  const { isAdmin } = useAuth()
  const { inspectors } = useInspectors()

  // Calculate inspector stats
  const inspectorStats = {
    total: (inspectors || []).length,
    active: (inspectors || []).filter(i => i.active).length,
    psv: (inspectors || []).filter(i => i.specialties?.includes('PSV')).length,
    crane: (inspectors || []).filter(i => i.specialties?.includes('CRANE')).length,
    corrosion: (inspectors || []).filter(i => i.specialties?.includes('CORROSION')).length,
    upcoming_birthdays: (inspectors || []).filter(i => {
      if (!i.date_of_birth) return false
      const today = new Date()
      const birthDate = new Date(i.date_of_birth)
      const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate())
      if (thisYearBirthday < today) {
        thisYearBirthday.setFullYear(today.getFullYear() + 1)
      }
      const daysUntil = Math.ceil((thisYearBirthday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 30
    }).length
  }

  const today = new Date();
  const [month, setMonth] = useState(today.getMonth()); // 0-11
  const [year, setYear] = useState(today.getFullYear()); // e.g. 2024

  const goToPrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear(y => y - 1);
    } else {
      setMonth(m => m - 1);
    }
  };
  const goToNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear(y => y + 1);
    } else {
      setMonth(m => m + 1);
    }
  };

  console.log('month:', month, 'year:', year);

  if (!isAdmin()) {
    return (
      <div className="container mx-auto px-4 py-8">
        <AccessDenied message="Only administrators can access this section." />
      </div>
    )
  }

  return (
    <AdminOnly fallback={<AccessDenied />}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        {/* حذف عنوان تکراری */}
        {/* <div className="mb-10">
          <h1 className="text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground mt-2">Manage inspectors and specialties</p>
        </div> */}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
          <Card className="bg-background hover:bg-accent/10 transition-colors border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Total Inspectors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{inspectorStats.total}</div>
              <p className="text-xs text-muted-foreground">
                {inspectorStats.active} Active
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background hover:bg-accent/10 transition-colors border border-blue-500/20 dark:border-blue-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">PSV Inspectors</CardTitle>
              <Shield className="h-4 w-4 text-blue-500 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500 dark:text-blue-400">{inspectorStats.psv}</div>
              <p className="text-xs text-muted-foreground">
                Specialty count
              </p>
            </CardContent>
          </Card>

          <Card className="bg-background hover:bg-accent/10 transition-colors border border-green-500/20 dark:border-green-400/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Crane Inspectors</CardTitle>
              <Settings className="h-4 w-4 text-green-500 dark:text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500 dark:text-green-400">{inspectorStats.crane}</div>
              <p className="text-xs text-muted-foreground">
                Specialty count
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Corrosion Inspectors</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{inspectorStats.corrosion}</div>
              <p className="text-xs text-muted-foreground">
                Specialty count
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Birthdays</CardTitle>
              <Gift className="h-4 w-4 text-pink-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">{inspectorStats.upcoming_birthdays}</div>
              <p className="text-xs text-muted-foreground">
                Next 30 days
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <Card className="bg-background hover:bg-accent/10 transition-colors border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground">
                <Users className="w-5 h-5" />
                Inspector Management
              </CardTitle>
              <CardDescription>
                View, edit and manage inspector specialties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/inspectors" className="block">
                <Button className="w-full">
                  Manage Inspectors
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-background hover:bg-accent/10 transition-colors border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground">
                <Settings className="w-5 h-5" />
                Attendance Management
              </CardTitle>
              <CardDescription>
                Manage work schedules and attendance cycles
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/attendance" className="block">
                <Button className="w-full">
                  Manage Attendance
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-background hover:bg-accent/10 transition-colors border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground">
                <Plus className="w-5 h-5" />
                Add New Inspector
              </CardTitle>
              <CardDescription>
                Create new inspector and set specialties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/inspectors/new" className="block">
                <Button className="w-full">
                  Create Inspector
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-background hover:bg-accent/10 transition-colors border">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-foreground">
                <FileSpreadsheet className="w-5 h-5" />
                Bulk Operations
              </CardTitle>
              <CardDescription>
                Excel import/export, batch operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/admin/bulk-operations" className="block">
                <Button className="w-full">
                  Bulk Operations
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Attendance Overview */}
                {/* Monthly Attendance Overview */}
        <div className="bg-background rounded-lg mt-6">
          <MonthlyAttendanceGrid
            inspectors={(inspectors || []).filter(i => i.attendance_tracking_enabled)}
            month={month}
            year={year}
            onPrevMonth={goToPrevMonth}
            onNextMonth={goToNextMonth}
          />
        </div>
      </div>
    </AdminOnly>
  )
}