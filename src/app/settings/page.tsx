import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { OrganizationSettings } from '@/components/organization-settings'
import { NotificationSettings } from '@/components/notification-settings'
import { UserManagement } from '@/components/user-management'

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    redirect('/auth/signin')
  }

  const organizationId = session.user.organizationId

  // Get organization with settings
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      settings: true,
      users: {
        include: {
          roleAssignments: true,
        },
      },
    },
  })

  if (!organization) {
    redirect('/auth/signin')
  }

  // Get notification rules separately
  const notificationRules = await prisma.notificationRule.findMany({
    where: { 
      organizationId,
      isActive: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Check if user has management or finance role
  const userRoles = session.user.roles || []
  const canManageSettings = userRoles.includes('management') || userRoles.includes('finance')

  // Transform organization settings to convert Decimal to number
  const transformedOrganization = {
    ...organization,
    settings: organization.settings ? {
      ...organization.settings,
      defaultRetentionPercentage: organization.settings.defaultRetentionPercentage 
        ? Number(organization.settings.defaultRetentionPercentage) 
        : null,
      defaultAccountingBasis: organization.settings.defaultAccountingBasis || 'accrual',
    } : null,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">{organization.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!canManageSettings ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Access Restricted
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    You need management or finance permissions to access organization settings.
                    Contact your administrator to request access.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Organization Settings */}
            <div>
              <OrganizationSettings 
                organization={transformedOrganization}
              />
            </div>

            {/* Notification Settings */}
            <div>
              <NotificationSettings 
                organizationId={organizationId}
                notificationRules={notificationRules}
              />
            </div>

            {/* User Management */}
            <div>
              <UserManagement 
                organizationId={organizationId}
                users={organization.users}
                currentUserId={session.user.id}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
