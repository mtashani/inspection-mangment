import { Metadata } from 'next'
import { TemplateDetailsContainer } from '@/components/admin/templates/template-details-container'

interface TemplateDetailsPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: TemplateDetailsPageProps): Promise<Metadata> {
  return {
    title: `Template Details | Admin Panel`,
    description: `View and manage template details, validation, testing, and deployment`,
  }
}

export default function TemplateDetailsPage({ params }: TemplateDetailsPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Template Details</h1>
        <p className="text-muted-foreground">
          View and manage template details, validation, testing, and deployment.
        </p>
      </div>
      <TemplateDetailsContainer templateId={params.id} />
    </div>
  )
}