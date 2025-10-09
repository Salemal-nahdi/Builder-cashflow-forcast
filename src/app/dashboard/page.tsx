import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ForecastEngine } from '@/lib/forecast-engine'
import { addMonths } from 'date-fns'
import { DashboardClient } from '@/components/dashboard-client'
import { DashboardForecastWithDates } from '@/components/dashboard-forecast-with-dates'
import { DashboardProjectEditCard } from '@/components/dashboard-project-edit-card'
import { getOrganizationId } from '@/lib/get-org'

// Force dynamic rendering - don't pre-render this page
export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // No authentication - just get the organization
  const organizationId = await getOrganizationId()

  // Get organization data with error handling
  let organization
  try {
    organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      projects: {
        include: {
          projectGroup: true,
          milestones: {
            where: { status: { in: ['pending', 'invoiced'] } },
            orderBy: { expectedDate: 'asc' },
          },
          supplierClaims: {
            where: { status: { in: ['pending', 'invoiced'] } },
            orderBy: { expectedDate: 'asc' },
          },
          xeroTrackingMaps: {
            include: {
              trackingOption: {
                include: {
                  category: true
                }
              }
            }
          },
          xeroContactMap: {
            include: {
              contact: true
            }
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 6,
      },
    },
  })
  } catch (error) {
    console.error('Database error in dashboard:', error)
    // Return a basic dashboard with empty data
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Database Connection Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>Unable to load dashboard data. Please try refreshing the page or contact support if the issue persists.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!organization) {
    // Organization should always exist at this point, but handle edge case
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-red-800">Unable to load organization. Please refresh the page.</p>
          </div>
        </div>
      </div>
    )
  }

  // Generate forecast data starting from TODAY
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Start of today
  const startDate = today
  const endDate = addMonths(today, 6)
  const forecastEngine = new ForecastEngine(organizationId, startDate, endDate)
  const forecastPeriods = await forecastEngine.generateForecast('monthly')
  const cashflowSummary = await forecastEngine.getCashflowSummary()

  // Get Xero connection status with tracking categories and contacts
  const xeroConnection = await prisma.xeroConnection.findFirst({
    where: {
      organizationId,
      isActive: true,
    },
    include: {
      trackingCategories: {
        include: {
          options: true
        }
      },
      contacts: {
        where: {
          status: 'ACTIVE'
        },
        orderBy: {
          name: 'asc'
        }
      }
    }
  })

  // Get project groups for dropdown
  const projectGroups = await prisma.projectGroup.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' }
  })

  // Get actual events count
  const actualEventsCount = await prisma.actualEvent.count({
    where: {
      organizationId,
    },
  })

  return (
    <DashboardClient
      organization={organization}
      xeroConnection={xeroConnection}
      projects={organization.projects}
      cashflowSummary={cashflowSummary}
      projectGroups={projectGroups}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cash Position Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Current Balance</p>
                <p className="text-2xl font-bold text-gray-900">$100,000</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">6-Month Income</p>
                <p className="text-2xl font-bold text-gray-900">${cashflowSummary.totalIncome.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">6-Month Outgo</p>
                <p className="text-2xl font-bold text-gray-900">${Number(cashflowSummary.totalOutgo).toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Lowest Balance</p>
                <p className="text-2xl font-bold text-gray-900">${Number(cashflowSummary.lowestBalance).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          {xeroConnection && (
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Actual Events</p>
                  <p className="text-2xl font-bold text-gray-900">{actualEventsCount.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Cashflow Chart with View Controls and Date Range */}
        <DashboardForecastWithDates 
          initialPeriods={forecastPeriods}
          initialProjects={organization.projects}
          initialBalance={0}
        />

        {/* Projects Section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Recent Projects</h2>
            <Link
              href="/projects"
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              View all projects
            </Link>
          </div>
          
          {organization.projects.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No projects yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Projects will appear here after being added to the system.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {organization.projects.map((project) => (
                <DashboardProjectEditCard
                  key={project.id}
                  project={project}
                  xeroConnection={xeroConnection}
                  projectGroups={projectGroups}
                />
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/forecast"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Forecast</h3>
                <p className="text-gray-600">View detailed cashflow timeline</p>
              </div>
            </div>
          </Link>

          <Link
            href="/variance"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Variance</h3>
                <p className="text-gray-600">Actual vs forecast analysis</p>
              </div>
            </div>
          </Link>

          <Link
            href="/reports"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Reports</h3>
                <p className="text-gray-600">Export and share data</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </DashboardClient>
  )
}
