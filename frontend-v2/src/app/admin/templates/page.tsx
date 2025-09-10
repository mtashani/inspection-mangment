import { Metadata } from 'next'
import { TemplateManagement } from '@/components/admin/templates/template-management'

export const metadata: Metadata = {
  title: 'Template Management | Admin Panel',
  description: 'Manage report templates, create new templates, and configure template settings',
}

export default function TemplatesPage() {
  return <TemplateManagement />;
}