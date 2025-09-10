'use client'

import { useState, useEffect } from 'react'
import {
  ShareIcon,
  UserGroupIcon,
  LinkIcon,
  EnvelopeIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

export interface SharePermission {
  id: string
  userId: string
  userName: string
  userEmail: string
  userAvatar?: string
  permission: 'view' | 'edit' | 'admin'
  sharedDate: string
  sharedBy: string
  lastAccessed?: string
  isActive: boolean
}

export interface ShareLink {
  id: string
  name: string
  url: string
  permission: 'view' | 'edit'
  expiresAt?: string
  isPasswordProtected: boolean
  password?: string
  accessCount: number
  maxAccess?: number
  createdDate: string
  createdBy: string
  isActive: boolean
}

export interface ReportComment {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  timestamp: string
  isResolved: boolean
  replies: ReportComment[]
}

export interface ReportSharingProps {
  reportId: string
  reportName: string
  onClose: () => void
  className?: string
}

// Mock data
const MOCK_PERMISSIONS: SharePermission[] = [
  {
    id: 'perm-001',
    userId: 'user-001',
    userName: 'John Smith',
    userEmail: 'john.smith@company.com',
    userAvatar: '/avatars/john.jpg',
    permission: 'edit',
    sharedDate: '2024-02-01T10:00:00Z',
    sharedBy: 'Current User',
    lastAccessed: '2024-02-10T14:30:00Z',
    isActive: true
  },
  {
    id: 'perm-002',
    userId: 'user-002',
    userName: 'Jane Doe',
    userEmail: 'jane.doe@company.com',
    permission: 'view',
    sharedDate: '2024-02-05T15:00:00Z',
    sharedBy: 'Current User',
    lastAccessed: '2024-02-09T09:15:00Z',
    isActive: true
  }
]

const MOCK_SHARE_LINKS: ShareLink[] = [
  {
    id: 'link-001',
    name: 'Public View Link',
    url: 'https://app.company.com/reports/shared/abc123',
    permission: 'view',
    expiresAt: '2024-03-01T00:00:00Z',
    isPasswordProtected: false,
    accessCount: 15,
    maxAccess: 100,
    createdDate: '2024-02-01T10:00:00Z',
    createdBy: 'Current User',
    isActive: true
  }
]

const MOCK_COMMENTS: ReportComment[] = [
  {
    id: 'comment-001',
    userId: 'user-001',
    userName: 'John Smith',
    userAvatar: '/avatars/john.jpg',
    content: 'The RBI analysis section needs more detail on the calculation methodology.',
    timestamp: '2024-02-10T14:30:00Z',
    isResolved: false,
    replies: [
      {
        id: 'reply-001',
        userId: 'user-002',
        userName: 'Jane Doe',
        content: 'I agree. I can add more details about the probability calculations.',
        timestamp: '2024-02-10T15:00:00Z',
        isResolved: false,
        replies: []
      }
    ]
  }
]

export function ReportSharing({
  reportId,
  reportName,
  onClose,
  className
}: ReportSharingProps) {
  const [permissions, setPermissions] = useState<SharePermission[]>(MOCK_PERMISSIONS)
  const [shareLinks, setShareLinks] = useState<ShareLink[]>(MOCK_SHARE_LINKS)
  const [comments, setComments] = useState<ReportComment[]>(MOCK_COMMENTS)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [activeTab, setActiveTab] = useState('permissions')

  // Add user permission
  const handleAddPermission = async (userData: {
    email: string
    permission: 'view' | 'edit' | 'admin'
  }) => {
    try {
      const newPermission: SharePermission = {
        id: `perm-${Date.now()}`,
        userId: `user-${Date.now()}`,
        userName: userData.email.split('@')[0],
        userEmail: userData.email,
        permission: userData.permission,
        sharedDate: new Date().toISOString(),
        sharedBy: 'Current User',
        isActive: true
      }

      setPermissions(prev => [...prev, newPermission])
      setIsShareDialogOpen(false)
      toast.success(`Report shared with ${userData.email}`)
    } catch (error) {
      toast.error('Failed to share report')
    }
  }

  // Update permission
  const handleUpdatePermission = async (permissionId: string, newPermission: 'view' | 'edit' | 'admin') => {
    setPermissions(prev => prev.map(p =>
      p.id === permissionId ? { ...p, permission: newPermission } : p
    ))
    toast.success('Permission updated')
  }

  // Remove permission
  const handleRemovePermission = async (permissionId: string) => {
    if (window.confirm('Are you sure you want to remove this user\'s access?')) {
      setPermissions(prev => prev.filter(p => p.id !== permissionId))
      toast.success('Access removed')
    }
  }

  // Create share link
  const handleCreateShareLink = async (linkData: {
    name: string
    permission: 'view' | 'edit'
    expiresAt?: string
    isPasswordProtected: boolean
    password?: string
    maxAccess?: number
  }) => {
    try {
      const newLink: ShareLink = {
        id: `link-${Date.now()}`,
        name: linkData.name,
        url: `https://app.company.com/reports/shared/${Math.random().toString(36).substr(2, 9)}`,
        permission: linkData.permission,
        expiresAt: linkData.expiresAt,
        isPasswordProtected: linkData.isPasswordProtected,
        password: linkData.password,
        accessCount: 0,
        maxAccess: linkData.maxAccess,
        createdDate: new Date().toISOString(),
        createdBy: 'Current User',
        isActive: true
      }

      setShareLinks(prev => [...prev, newLink])
      setIsLinkDialogOpen(false)
      toast.success('Share link created')
    } catch (error) {
      toast.error('Failed to create share link')
    }
  }

  // Delete share link
  const handleDeleteShareLink = async (linkId: string) => {
    if (window.confirm('Are you sure you want to delete this share link?')) {
      setShareLinks(prev => prev.filter(l => l.id !== linkId))
      toast.success('Share link deleted')
    }
  }

  // Add comment
  const handleAddComment = async () => {
    if (!newComment.trim()) return

    const comment: ReportComment = {
      id: `comment-${Date.now()}`,
      userId: 'current-user',
      userName: 'Current User',
      content: newComment,
      timestamp: new Date().toISOString(),
      isResolved: false,
      replies: []
    }

    setComments(prev => [...prev, comment])
    setNewComment('')
    toast.success('Comment added')
  }

  // Copy link to clipboard
  const handleCopyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  // Get user initials
  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShareIcon className="h-5 w-5" />
            <span>Share Report: {reportName}</span>
          </DialogTitle>
          <DialogDescription>
            Manage sharing permissions and collaborate on this report
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="links">Share Links</TabsTrigger>
            <TabsTrigger value="comments">Comments</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          {/* Permissions Tab */}
          <TabsContent value="permissions" className="space-y-4 overflow-y-auto max-h-96">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">User Permissions</h3>
              <Button onClick={() => setIsShareDialogOpen(true)}>
                <UserGroupIcon className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            <div className="space-y-3">
              {permissions.map(permission => (
                <Card key={permission.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={permission.userAvatar} alt={permission.userName} />
                          <AvatarFallback>
                            {getUserInitials(permission.userName)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <p className="font-medium">{permission.userName}</p>
                          <p className="text-sm text-muted-foreground">{permission.userEmail}</p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                            <span>Shared {formatDate(permission.sharedDate)}</span>
                            {permission.lastAccessed && (
                              <span>• Last accessed {formatDate(permission.lastAccessed)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Select
                          value={permission.permission}
                          onValueChange={(value: any) => handleUpdatePermission(permission.id, value)}
                        >
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="view">View</SelectItem>
                            <SelectItem value="edit">Edit</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemovePermission(permission.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Share Links Tab */}
          <TabsContent value="links" className="space-y-4 overflow-y-auto max-h-96">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Share Links</h3>
              <Button onClick={() => setIsLinkDialogOpen(true)}>
                <LinkIcon className="h-4 w-4 mr-2" />
                Create Link
              </Button>
            </div>

            <div className="space-y-3">
              {shareLinks.map(link => (
                <Card key={link.id}>
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{link.name}</p>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {link.permission}
                            </Badge>
                            <span>•</span>
                            <span>{link.accessCount} accesses</span>
                            {link.expiresAt && (
                              <>
                                <span>•</span>
                                <span>Expires {formatDate(link.expiresAt)}</span>
                              </>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteShareLink(link.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Input
                          value={link.url}
                          readOnly
                          className="flex-1 text-sm"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(link.url)}
                        >
                          Copy
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments" className="space-y-4 overflow-y-auto max-h-96">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="flex-1"
                />
                <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                  Post
                </Button>
              </div>

              <div className="space-y-4">
                {comments.map(comment => (
                  <Card key={comment.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(comment.userName)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="font-medium text-sm">{comment.userName}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(comment.timestamp)}
                            </p>
                            {comment.isResolved && (
                              <Badge variant="outline" className="text-xs">
                                <CheckCircleIcon className="h-3 w-3 mr-1" />
                                Resolved
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm">{comment.content}</p>
                          
                          {comment.replies.length > 0 && (
                            <div className="mt-3 pl-4 border-l-2 border-muted space-y-2">
                              {comment.replies.map(reply => (
                                <div key={reply.id} className="flex items-start space-x-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {getUserInitials(reply.userName)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="flex items-center space-x-2">
                                      <p className="font-medium text-xs">{reply.userName}</p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDate(reply.timestamp)}
                                      </p>
                                    </div>
                                    <p className="text-xs mt-1">{reply.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4 overflow-y-auto max-h-96">
            <h3 className="text-lg font-medium">Recent Activity</h3>
            
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 border rounded">
                <EyeIcon className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm">John Smith viewed the report</p>
                  <p className="text-xs text-muted-foreground">2 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded">
                <PencilIcon className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm">Jane Doe edited the RBI section</p>
                  <p className="text-xs text-muted-foreground">5 hours ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded">
                <ShareIcon className="h-4 w-4 text-purple-600" />
                <div className="flex-1">
                  <p className="text-sm">Report shared with mike.johnson@company.com</p>
                  <p className="text-xs text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>

        {/* Add User Dialog */}
        <AddUserDialog
          isOpen={isShareDialogOpen}
          onClose={() => setIsShareDialogOpen(false)}
          onAdd={handleAddPermission}
        />

        {/* Create Link Dialog */}
        <CreateLinkDialog
          isOpen={isLinkDialogOpen}
          onClose={() => setIsLinkDialogOpen(false)}
          onCreate={handleCreateShareLink}
        />
      </DialogContent>
    </Dialog>
  )
}

// Add User Dialog
interface AddUserDialogProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (userData: { email: string; permission: 'view' | 'edit' | 'admin' }) => void
}

function AddUserDialog({ isOpen, onClose, onAdd }: AddUserDialogProps) {
  const [email, setEmail] = useState('')
  const [permission, setPermission] = useState<'view' | 'edit' | 'admin'>('view')

  const handleAdd = () => {
    if (email.trim()) {
      onAdd({ email: email.trim(), permission })
      setEmail('')
      setPermission('view')
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add User</DialogTitle>
          <DialogDescription>
            Share this report with a user by entering their email address
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@company.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="permission">Permission Level</Label>
            <Select value={permission} onValueChange={(value: any) => setPermission(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="edit">Can Edit</SelectItem>
                <SelectItem value="admin">Admin Access</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAdd} disabled={!email.trim()}>Add User</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Create Link Dialog
interface CreateLinkDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (linkData: {
    name: string
    permission: 'view' | 'edit'
    expiresAt?: string
    isPasswordProtected: boolean
    password?: string
    maxAccess?: number
  }) => void
}

function CreateLinkDialog({ isOpen, onClose, onCreate }: CreateLinkDialogProps) {
  const [name, setName] = useState('')
  const [permission, setPermission] = useState<'view' | 'edit'>('view')
  const [expiresAt, setExpiresAt] = useState('')
  const [isPasswordProtected, setIsPasswordProtected] = useState(false)
  const [password, setPassword] = useState('')
  const [maxAccess, setMaxAccess] = useState<number | undefined>()

  const handleCreate = () => {
    if (name.trim()) {
      onCreate({
        name: name.trim(),
        permission,
        expiresAt: expiresAt || undefined,
        isPasswordProtected,
        password: isPasswordProtected ? password : undefined,
        maxAccess
      })
      
      // Reset form
      setName('')
      setPermission('view')
      setExpiresAt('')
      setIsPasswordProtected(false)
      setPassword('')
      setMaxAccess(undefined)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Share Link</DialogTitle>
          <DialogDescription>
            Create a shareable link for this report
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="linkName">Link Name</Label>
            <Input
              id="linkName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Public view link"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="linkPermission">Permission Level</Label>
            <Select value={permission} onValueChange={(value: any) => setPermission(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="view">View Only</SelectItem>
                <SelectItem value="edit">Can Edit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
            <Input
              id="expiresAt"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxAccess">Max Access Count (Optional)</Label>
            <Input
              id="maxAccess"
              type="number"
              value={maxAccess || ''}
              onChange={(e) => setMaxAccess(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="Unlimited"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="passwordProtected"
              checked={isPasswordProtected}
              onCheckedChange={setIsPasswordProtected}
            />
            <Label htmlFor="passwordProtected">Password Protected</Label>
          </div>

          {isPasswordProtected && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>Create Link</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { SharePermission, ShareLink, ReportComment, ReportSharingProps }