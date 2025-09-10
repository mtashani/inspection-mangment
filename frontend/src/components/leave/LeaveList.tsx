import React from 'react'

export interface Leave {
  id: number
  inspector_id: number
  from: string
  to: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

interface LeaveListProps {
  leaves: Leave[]
  isAdmin?: boolean
  onApprove?: (id: number) => void
  onReject?: (id: number) => void
  onDelete?: (id: number) => void
}

export const LeaveList: React.FC<LeaveListProps> = ({ leaves, isAdmin, onApprove, onReject, onDelete }) => {
  if (!leaves.length) {
    return <div className="text-gray-500 text-center p-4">هیچ مرخصی ثبت نشده است.</div>
  }
  return (
    <div className="space-y-4">
      {leaves.map(leave => (
        <div key={leave.id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 bg-gray-50">
          <div>
            <div className="font-medium">از {leave.from} تا {leave.to}</div>
            <div className="text-sm text-gray-600">دلیل: {leave.reason}</div>
            <div className="text-xs text-gray-400">درخواست: {new Date(leave.created_at).toLocaleDateString('fa-IR')}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs font-bold ${leave.status === 'approved' ? 'bg-green-200 text-green-800' : leave.status === 'rejected' ? 'bg-red-200 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{leave.status === 'approved' ? 'تایید شده' : leave.status === 'rejected' ? 'رد شده' : 'در انتظار تایید'}</span>
            {isAdmin && leave.status === 'pending' && (
              <>
                <button className="px-2 py-1 bg-green-500 text-white rounded text-xs" onClick={() => onApprove?.(leave.id)}>تایید</button>
                <button className="px-2 py-1 bg-red-500 text-white rounded text-xs" onClick={() => onReject?.(leave.id)}>رد</button>
              </>
            )}
            {isAdmin && (
              <button className="px-2 py-1 bg-gray-300 text-gray-700 rounded text-xs" onClick={() => onDelete?.(leave.id)}>حذف</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
} 