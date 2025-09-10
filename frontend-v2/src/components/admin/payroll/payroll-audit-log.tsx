'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Shield,
  Search,
  Filter,
  Calendar,
  User,
  Activity,
  Eye,
  Download
} from 'lucide-react'
import { AuditLog } from '@/types/admin'

interface PayrollAuditLogProps {
  logs: AuditLog[]
  loading?: boolean
  onExport?: () => void
}

export function PayrollAuditLog({ logs, loading, onExport }: PayrollAuditLogProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('')
  const [userFilter, setUserFilter] = useState<string>('')
  const [dateFilter, setDateFilter] = useState<string>('')

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.resource.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesAction = !actionFilter || log.action === actionFilter
    const matchesUser = !userFilter || log.userName === userFilter
    const matchesDate = !dateFilter || log.createdAt.startsWith(dateFilter)

    return matchesSearch && matchesAction && matchesUser && matchesDate
  })

  const uniqueActions = [...new Set(logs.map(log => log.action))]
  const uniqueUsers = [...new Set(logs.map(log => log.userName))]

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('GENERATE')) return 'bg-green-100 text-green-800'
    if (action.includes('UPDATE') || action.includes('MODIFY')) return 'bg-blue-100 text-blue-800'
    if (action.includes('DELETE') || action.includes('REJECT')) return 'bg-red-100 text-red-800'
    if (action.includes('APPROVE')) return 'bg-green-100 text-green-800'
    if (action.includes('VIEW') || action.includes('EXPORT')) return 'bg-gray-100 text-gray-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Payroll Audit Log
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {filteredLogs.length} of {logs.length} entries
              </Badge>
              {onExport && (
                <Button variant="outline" size="sm" onClick={onExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All actions</SelectItem>
                  {uniqueActions.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User</label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All users</SelectItem>
                  {uniqueUsers.map(user => (
                    <SelectItem key={user} value={user}>{user}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Log Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="space-y-3">
              {filteredLogs.map((log) => (
                <AuditLogEntry key={log.id} log={log} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No audit log entries found matching the current filters
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface AuditLogEntryProps {
  log: AuditLog
}

function AuditLogEntry({ log }: AuditLogEntryProps) {
  const [showDetails, setShowDetails] = useState(false)

  const getActionColor = (action: string) => {
    if (action.includes('CREATE') || action.includes('GENERATE')) return 'bg-green-100 text-green-800'
    if (action.includes('UPDATE') || action.includes('MODIFY')) return 'bg-blue-100 text-blue-800'
    if (action.includes('DELETE') || action.includes('REJECT')) return 'bg-red-100 text-red-800'
    if (action.includes('APPROVE')) return 'bg-green-100 text-green-800'
    if (action.includes('VIEW') || action.includes('EXPORT')) return 'bg-gray-100 text-gray-800'
    return 'bg-yellow-100 text-yellow-800'
  }

  return (
    <div className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Badge className={getActionColor(log.action)}>
              {log.action}
            </Badge>
            <span className="font-medium">{log.resource}</span>
            {log.resourceId && (
              <Badge variant="outline" className="text-xs">
                ID: {log.resourceId}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{log.userName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{new Date(log.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              <span>{log.ipAddress}</span>
            </div>
          </div>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {showDetails && (
        <div className="mt-4 pt-4 border-t">
          <div className="space-y-2">
            <div>
              <span className="text-sm font-medium">User Agent:</span>
              <p className="text-sm text-muted-foreground">{log.userAgent}</p>
            </div>
            
            {Object.keys(log.details).length > 0 && (
              <div>
                <span className="text-sm font-medium">Details:</span>
                <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                  {JSON.stringify(log.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}