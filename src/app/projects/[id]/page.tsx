import { ProjectDetail } from '@/components/project-detail'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  
  const response = await fetch(`${baseUrl}/api/projects/${params.id}`, {
    cache: 'no-store'
  })

  if (!response.ok) {
    notFound()
  }

  const project = await response.json()

  // Get tracking categories for Xero mapping
  const trackingResponse = await fetch(`${baseUrl}/api/xero/tracking`, {
    cache: 'no-store'
  })
  const trackingCategories = trackingResponse.ok ? await trackingResponse.json() : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <ProjectDetail project={project} trackingCategories={trackingCategories} />
    </div>
  )
}

