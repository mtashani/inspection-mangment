import React, { useState } from 'react'

interface LeaveRequestFormProps {
  onSubmit: (from: string, to: string, reason: string) => Promise<void>
  loading?: boolean
}

export const LeaveRequestForm: React.FC<LeaveRequestFormProps> = ({ onSubmit, loading }) => {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    if (!from || !to || !reason) {
      setError('همه فیلدها الزامی است.')
      return
    }
    try {
      await onSubmit(from, to, reason)
      setFrom('')
      setTo('')
      setReason('')
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'خطا در ثبت درخواست')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-white">
      <div>
        <label className="block mb-1 font-medium">تاریخ شروع</label>
        <input type="date" className="input input-bordered w-full" value={from} onChange={e => setFrom(e.target.value)} />
      </div>
      <div>
        <label className="block mb-1 font-medium">تاریخ پایان</label>
        <input type="date" className="input input-bordered w-full" value={to} onChange={e => setTo(e.target.value)} />
      </div>
      <div>
        <label className="block mb-1 font-medium">دلیل مرخصی</label>
        <input type="text" className="input input-bordered w-full" value={reason} onChange={e => setReason(e.target.value)} />
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {success && <div className="text-green-600 text-sm">درخواست با موفقیت ثبت شد.</div>}
      <button type="submit" className="btn btn-primary w-full" disabled={loading}>{loading ? 'در حال ارسال...' : 'ثبت درخواست مرخصی'}</button>
    </form>
  )
} 