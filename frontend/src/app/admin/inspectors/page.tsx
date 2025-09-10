'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useInspectors } from '@/contexts/inspectors-context'
import { useSpecialtyExtended } from '@/contexts/specialty-context'
import { AdminOnly, AccessDenied } from '@/components/auth/permission-guard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import { DeleteConfirmationDialog } from '@/components/ui/delete-confirmation-dialog'
import { Search, Edit, Shield, Settings, FileSpreadsheet, Save, X, Plus, Trash2 } from 'lucide-react'
import { Inspector, SpecialtyCode, SpecialtyMap } from '@/types/inspector'
import { SPECIALTY_COLORS } from '@/types/inspector'
import { toast } from 'sonner'
import Link from 'next/link'

interface SpecialtyEditState {
  inspector: Inspector | null
  specialties: SpecialtyMap
  saving: boolean
}

export default function InspectorsManagementPage() {
  const router = useRouter()
  const { inspectors, loading } = useInspectors()
  const { updateInspectorSpecialties } = useSpecialtyExtended()
  const [searchTerm, setSearchTerm] = useState('')
  const [editingSpecialty, setEditingSpecialty] = useState<SpecialtyEditState>({
    inspector: null,
    specialties: { PSV: false, CRANE: false, CORROSION: false },
    saving: false
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [inspectorToDelete, setInspectorToDelete] = useState<Inspector | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Filter inspectors based on search
  const filteredInspectors = (inspectors || []).filter(inspector =>
    inspector.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inspector.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inspector.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const openSpecialtyEditor = (inspector: Inspector) => {
    const specialties = inspector.specialties || []
    const currentSpecialties: SpecialtyMap = {
      PSV: specialties.includes('PSV'),
      CRANE: specialties.includes('CRANE'),
      CORROSION: specialties.includes('CORROSION')
    }
    
    setEditingSpecialty({
      inspector,
      specialties: currentSpecialties,
      saving: false
    })
  }

  const closeSpecialtyEditor = () => {
    setEditingSpecialty({
      inspector: null,
      specialties: { PSV: false, CRANE: false, CORROSION: false },
      saving: false
    })
  }

  const handleSpecialtyChange = (specialty: SpecialtyCode, checked: boolean) => {
    setEditingSpecialty(prev => ({
      ...prev,
      specialties: {
        ...prev.specialties,
        [specialty]: checked
      }
    }))
  }

  const saveSpecialties = async () => {
    if (!editingSpecialty.inspector) return

    setEditingSpecialty(prev => ({ ...prev, saving: true }))

    try {
      await updateInspectorSpecialties(
        editingSpecialty.inspector!.id,
        editingSpecialty.specialties
      )
      
      toast.success('Specialties updated successfully')
      closeSpecialtyEditor()
      // Note: Data will be automatically refreshed by the context
    } catch (error) {
      toast.error('Error updating specialties')
      console.error('Error updating specialties:', error)
    } finally {
      setEditingSpecialty(prev => ({ ...prev, saving: false }))
    }
  }

  const handleCreateInspector = () => {
    router.push('/admin/inspectors/new')
  }

  const openDeleteDialog = (inspector: Inspector) => {
    setInspectorToDelete(inspector)
    setDeleteDialogOpen(true)
  }

  const handleDeleteInspector = async () => {
    if (!inspectorToDelete) return

    setIsDeleting(true)
    try {
      // TODO: API call to delete inspector
      console.log('Deleting inspector:', inspectorToDelete.id)
      
      toast.success(`Inspector "${inspectorToDelete.name}" has been deleted`)
      setInspectorToDelete(null)
      
      // Refresh the list
      // await refreshInspectors() // We'll implement this when we add API
      
    } catch (error) {
      console.error('Error deleting inspector:', error)
      throw error // Re-throw to be handled by DeleteConfirmationDialog
    } finally {
      setIsDeleting(false)
    }
  }

  const getSpecialtyBadge = (specialty: SpecialtyCode) => {
    const colorClass = SPECIALTY_COLORS[specialty]
    const icons = {
      PSV: <Shield className="w-3 h-3" />,
      CRANE: <Settings className="w-3 h-3" />,
      CORROSION: <FileSpreadsheet className="w-3 h-3" />
    }

    return (
      <Badge key={specialty} className={`${colorClass} flex items-center gap-1 rounded-md`}>
        {icons[specialty]}
        {specialty}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <AdminOnly fallback={<AccessDenied />}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inspector Management</h1>
            <p className="text-gray-600 mt-2">Manage inspector specialties and information</p>
          </div>
          <Button onClick={handleCreateInspector} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Create Inspector
          </Button>
        </div>

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by name, employee ID, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Inspectors Table */}
        <Card>
          <CardHeader>
            <CardTitle>Inspector List ({filteredInspectors.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Employee ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Inspector Type</TableHead>
                    <TableHead>Specialties</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInspectors.map((inspector) => (
                    <TableRow key={inspector.id}>
                      <TableCell className="font-medium">
                        <Link 
                          href={`/admin/inspectors/${inspector.id}`}
                          className="hover:underline text-blue-600 hover:text-blue-800"
                        >
                          {inspector.name}
                        </Link>
                      </TableCell>
                      <TableCell>{inspector.employee_id}</TableCell>
                      <TableCell>{inspector.email}</TableCell>
                      <TableCell>{inspector.inspector_type}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {(inspector.specialties || []).length > 0 ? (
                            (inspector.specialties || []).map((specialty) =>
                              getSpecialtyBadge(specialty as SpecialtyCode)
                            )
                          ) : (
                            <Badge variant="outline" className="text-xs rounded-md">
                              No Specialty
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant={inspector.active ? "default" : "secondary"} className="rounded-md">
                            {inspector.active ? 'Active' : 'Inactive'}
                          </Badge>
                          {inspector.can_login && (
                            <Badge variant="outline" className="rounded-md">Login Access</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 justify-center">
                          {/* Edit Specialties Dialog */}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openSpecialtyEditor(inspector)}
                                className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                              <DialogHeader>
                                <DialogTitle>Edit Inspector Specialties</DialogTitle>
                                <DialogDescription>
                                  Select specialties for {editingSpecialty.inspector?.name}
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4 py-4">
                                {/* PSV Checkbox */}
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <Checkbox
                                    id="psv"
                                    checked={editingSpecialty.specialties.PSV}
                                    onCheckedChange={(checked) => 
                                      handleSpecialtyChange('PSV', checked as boolean)
                                    }
                                    disabled={editingSpecialty.saving}
                                  />
                                  <label
                                    htmlFor="psv"
                                    className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    <Shield className="w-4 h-4 text-blue-600" />
                                    PSV Access
                                    <span className="text-xs text-gray-500">(Calibration + Excel)</span>
                                  </label>
                                </div>

                                {/* CRANE Checkbox */}
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <Checkbox
                                    id="crane"
                                    checked={editingSpecialty.specialties.CRANE}
                                    onCheckedChange={(checked) => 
                                      handleSpecialtyChange('CRANE', checked as boolean)
                                    }
                                    disabled={editingSpecialty.saving}
                                  />
                                  <label
                                    htmlFor="crane"
                                    className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    <Settings className="w-4 h-4 text-green-600" />
                                    Crane Access
                                    <span className="text-xs text-gray-500">(Inspection + Excel)</span>
                                  </label>
                                </div>

                                {/* CORROSION Checkbox */}
                                <div className="flex items-center space-x-2 space-x-reverse">
                                  <Checkbox
                                    id="corrosion"
                                    checked={editingSpecialty.specialties.CORROSION}
                                    onCheckedChange={(checked) => 
                                      handleSpecialtyChange('CORROSION', checked as boolean)
                                    }
                                    disabled={editingSpecialty.saving}
                                  />
                                  <label
                                    htmlFor="corrosion"
                                    className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    <FileSpreadsheet className="w-4 h-4 text-orange-600" />
                                    Corrosion Access
                                    <span className="text-xs text-gray-500">(Analysis + Excel)</span>
                                  </label>
                                </div>
                              </div>

                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={closeSpecialtyEditor}
                                  disabled={editingSpecialty.saving}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Cancel
                                </Button>
                                <Button
                                  onClick={saveSpecialties}
                                  disabled={editingSpecialty.saving}
                                >
                                  {editingSpecialty.saving ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                  ) : (
                                    <Save className="w-4 h-4 mr-2" />
                                  )}
                                  Save
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          {/* Delete Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(inspector)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredInspectors.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchTerm ? 'No inspectors found matching your search' : 'No inspectors found'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <DeleteConfirmationDialog
          isOpen={deleteDialogOpen}
          setIsOpen={setDeleteDialogOpen}
          title="Delete Inspector"
          description={`Are you sure you want to delete inspector "${inspectorToDelete?.name}"? This action cannot be undone and will permanently remove all data associated with this inspector.`}
          onConfirm={handleDeleteInspector}
          isDeleting={isDeleting}
          confirmationText="delete"
        />
      </div>
    </AdminOnly>
  )
}