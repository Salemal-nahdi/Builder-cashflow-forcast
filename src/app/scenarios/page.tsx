import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ScenarioCard } from '@/components/scenario-card'
import { CreateScenarioButton } from '@/components/create-scenario-button'

export default async function ScenariosPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    redirect('/auth/signin')
  }

  const organizationId = session.user.organizationId

  // Get all scenarios for the organization
  const scenarios = await prisma.scenario.findMany({
    where: { organizationId },
    include: {
      scenarioShifts: {
        include: {
          scenario: true,
        },
      },
      _count: {
        select: {
          scenarioShifts: true,
        },
      },
    },
    orderBy: [
      { isBase: 'desc' },
      { createdAt: 'desc' },
    ],
  })

  // Get organization for header
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Scenario Planning</h1>
              <p className="text-gray-600">{organization?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <CreateScenarioButton organizationId={organizationId} />
              <Link
                href="/forecast"
                className="text-gray-600 hover:text-gray-900"
              >
                Forecast
              </Link>
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
        {/* Introduction */}
        <div className="mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">
                  What-if Scenario Planning
                </h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>
                    Create different scenarios to model how delays, cost changes, or other factors might impact your cashflow. 
                    Compare scenarios side-by-side to make informed decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scenarios Grid */}
        {scenarios.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No scenarios yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first scenario to start modeling different outcomes.
            </p>
            <div className="mt-6">
              <CreateScenarioButton organizationId={organizationId} />
            </div>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm font-medium text-gray-600">Total Scenarios</p>
                <p className="text-2xl font-bold text-gray-900">{scenarios.length}</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm font-medium text-gray-600">Active Scenarios</p>
                <p className="text-2xl font-bold text-green-600">
                  {scenarios.filter(s => !s.isBase).length}
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm font-medium text-gray-600">Total Adjustments</p>
                <p className="text-2xl font-bold text-blue-600">
                  {scenarios.reduce((sum, s) => sum + s._count.scenarioShifts, 0)}
                </p>
              </div>
            </div>

            {/* Scenarios Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenarios.map((scenario) => (
                <ScenarioCard key={scenario.id} scenario={scenario} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
