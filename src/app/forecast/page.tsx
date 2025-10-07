import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { ForecastEngine } from '@/lib/forecast-engine'
import { addMonths } from 'date-fns'
import { ForecastWithDateRange } from '@/components/forecast-with-date-range'

export default async function ForecastPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    redirect('/auth/signin')
  }

  const organizationId = session.user.organizationId

  // Get organization data
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  // Generate forecast data starting from TODAY
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Start of today
  const startDate = today
  const endDate = addMonths(today, 6)
  const forecastEngine = new ForecastEngine(organizationId, startDate, endDate)
  const forecastPeriods = await forecastEngine.generateForecast('monthly')
  const cashflowSummary = await forecastEngine.getCashflowSummary()

  // Get all projects for gantt/by-project views
  const projects = await prisma.project.findMany({
    where: { organizationId },
    include: {
      milestones: {
        where: { status: { in: ['pending', 'invoiced'] } },
        orderBy: { expectedDate: 'asc' },
      },
      supplierClaims: {
        where: { status: { in: ['pending', 'invoiced'] } },
        orderBy: { expectedDate: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Cashflow Forecast</h1>
              <p className="text-gray-600">{organization?.name} - Interactive Views</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-gray-600 hover:text-gray-900"
              >
                Dashboard
              </Link>
              <Link
                href="/projects"
                className="text-gray-600 hover:text-gray-900"
              >
                Projects
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600">6-Month Income</p>
            <p className="text-2xl font-bold text-green-600">${Number(cashflowSummary.totalIncome).toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600">6-Month Outgo</p>
            <p className="text-2xl font-bold text-red-600">${Number(cashflowSummary.totalOutgo).toLocaleString()}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600">Net Cashflow</p>
            <p className={`text-2xl font-bold ${Number(cashflowSummary.netCashflow) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${Number(cashflowSummary.netCashflow).toLocaleString()}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-sm font-medium text-gray-600">Lowest Balance</p>
            <p className={`text-2xl font-bold ${Number(cashflowSummary.lowestBalance) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${Number(cashflowSummary.lowestBalance).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Interactive Forecast Views with Date Range */}
        <div className="mb-8">
          <ForecastWithDateRange 
            initialPeriods={forecastPeriods}
            initialProjects={projects}
            initialBalance={0}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/scenarios"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Scenario Planning</h3>
                <p className="text-gray-600">Create what-if scenarios</p>
              </div>
            </div>
          </Link>

          <Link
            href="/forecast-lines"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Forecast Lines</h3>
                <p className="text-gray-600">Manage recurring items</p>
              </div>
            </div>
          </Link>

          <Link
            href="/reports"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Export Report</h3>
                <p className="text-gray-600">Download forecast data</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
