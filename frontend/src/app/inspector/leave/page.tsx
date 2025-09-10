'use client'

import { useAuth } from '@/contexts/auth-context'
import { useEffect, useState } from 'react'
import { getLeaves, requestLeave } from '@/api/leave'
import { LeaveList, Leave } from '@/components/leave/LeaveList'
import { LeaveRequestForm } from '@/components/leave/LeaveRequestForm'
import { useNotifications } from '@/contexts/notifications-context'

export default function InspectorLeavePage() {
  const { inspector } = useAuth()
  const { addNotification } = useNotifications()
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const fetchLeaves = () => {
    if (!inspector) return
    setLoading(true)
    setError(null)
    getLeaves(inspector.id)
      .then(data => setLeaves(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchLeaves()
    // eslint-disable-next-line
  }, [inspector])

  const handleRequest = async (from: string, to: string, reason: string) => {
    if (!inspector) return
    setFormLoading(true)
    setError(null)
    try {
      await requestLeave(inspector.id, from, to, reason)
      fetchLeaves()
      addNotification({
        title: 'درخواست مرخصی ثبت شد',
        message: 'درخواست مرخصی شما با موفقیت ثبت شد و در انتظار تایید است.',
        type: 'system_alert',
        priority: 'medium',
      })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطا در ثبت درخواست')
      addNotification({
        title: 'خطا در ثبت مرخصی',
        message: err instanceof Error ? err.message : 'خطا در ثبت درخواست مرخصی. لطفاً مجدداً تلاش کنید.',
        type: 'system_alert',
        priority: 'high',
      })
    } finally {
      setFormLoading(false)
    }
  }

  if (!inspector) {
    return <div className="p-8 text-center text-gray-500">برای مشاهده مرخصی‌ها وارد شوید.</div>
  }
  if (loading) {
    return <div className="p-8 text-center text-blue-600">در حال بارگذاری...</div>
  }
  if (error) {
    return <div className="p-8 text-center text-red-600">خطا: {error}</div>
  }
  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">مدیریت مرخصی‌های من</h1>
      <LeaveRequestForm onSubmit={handleRequest} loading={formLoading} />
      <div className="my-8" />
      <LeaveList leaves={leaves} />
    </div>
  )
} 