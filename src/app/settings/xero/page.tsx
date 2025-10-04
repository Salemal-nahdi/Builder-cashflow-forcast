import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { XeroSettingsClient } from './xero-settings-client'

export default async function XeroSettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const organizationId = session.user.organizationId
  if (!organizationId) {
    redirect('/auth/signin')
  }

  // Get Xero connection
  const xeroConnection = await prisma.xeroConnection.findFirst({
    where: {
      organizationId,
      isActive: true,
    },
  })

  // Get projects
  const projects = await prisma.project.findMany({
    where: { organizationId },
    include: {
      xeroTrackingMaps: {
        include: {
          trackingOption: {
            include: {
              category: true,
            },
          },
        },
      },
      xeroContactMap: {
        include: {
          contact: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Get tracking categories and options
  const trackingCategories = await prisma.xeroTrackingCategory.findMany({
    where: {
      connectionId: xeroConnection?.id,
    },
    include: {
      options: {
        where: { status: 'ACTIVE' },
        orderBy: { name: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Get contacts
  const contacts = await prisma.xeroContact.findMany({
    where: {
      connectionId: xeroConnection?.id,
      status: 'ACTIVE',
    },
    orderBy: { name: 'asc' },
  })

  // Get unmapped actual events
  const unmappedEvents = await prisma.actualEvent.findMany({
    where: {
      organizationId,
      projectId: null,
      sourceType: {
        in: ['invoice', 'bill', 'payment', 'bank_transaction'],
      },
    },
    include: {
      project: true,
    },
    orderBy: {
      occurredAt: 'desc',
    },
    take: 50,
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Xero Integration</h1>
          <p className="text-gray-600 mt-2">
            Connect and configure your Xero integration for automatic cashflow tracking
          </p>
        </div>

        <XeroSettingsClient
          xeroConnection={xeroConnection}
          projects={projects}
          trackingCategories={trackingCategories}
          contacts={contacts}
          unmappedEvents={unmappedEvents}
        />
      </div>
    </div>
  )
}
