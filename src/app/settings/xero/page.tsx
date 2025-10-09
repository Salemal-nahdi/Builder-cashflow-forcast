import { XeroSettings } from '@/components/xero-settings'
import { prisma } from '@/lib/prisma'
import { getOrganizationId } from '@/lib/get-org'

export const dynamic = 'force-dynamic'

export default async function XeroSettingsPage() {
  const organizationId = await getOrganizationId()

  // Get Xero connection
  const connection = await prisma.xeroConnection.findFirst({
    where: {
      organizationId,
      isActive: true
    }
  })

  // Get projects
  const projects = await prisma.project.findMany({
    where: { organizationId },
    include: {
      xeroMaps: {
        include: {
          trackingOption: {
            include: {
              category: true
            }
          }
        }
      }
    },
    orderBy: { name: 'asc' }
  })

  // Get tracking categories
  const trackingCategories = await prisma.xeroTrackingCategory.findMany({
    where: { organizationId },
    include: {
      options: true
    },
    orderBy: { name: 'asc' }
  })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <XeroSettings
        connection={JSON.parse(JSON.stringify(connection))}
        projects={JSON.parse(JSON.stringify(projects))}
        trackingCategories={JSON.parse(JSON.stringify(trackingCategories))}
      />
    </div>
  )
}

