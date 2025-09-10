import { Metadata } from 'next'
import { AttendanceManagement } from '@/components/admin/attendance/attendance-management'

export const metadata: Metadata = {
  title: 'Attendance Management | Admin Panel',
  description: 'Manage inspector attendance, work cycles, and schedules',
}

export default function AttendancePage() {
  return <AttendanceManagement />;
}