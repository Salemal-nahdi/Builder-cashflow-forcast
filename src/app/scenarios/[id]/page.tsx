import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { ScenarioEditor } from '@/components/scenario-editor'
import { ScenarioComparison } from '@/components/scenario-comparison'

interface ScenarioDetailPageProps {
  params: {
    id: string
  }
}

export default async function ScenarioDetailPage({ params }: ScenarioDetailPageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    redirect('/auth/signin')
  }

  const organizationId = session.user.organizationId

  // Get scenario with all related data
  const scenario = await prisma.scenario.findFirst({
    where: {
      id: params.id,
      organizationId,
    },
    include: {
      scenarioShifts: {
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!scenario) {
    notFound()
  }

  // Get all projects for the organization
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
      materialOrders: {
        where: { status: { in: ['pending', 'ordered'] } },
        orderBy: { expectedDate: 'asc' },
      },
    },
    orderBy: { name: 'asc' },
  })

  // Get base scenario for comparison
  const baseScenario = await prisma.scenario.findFirst({
    where: {
      organizationId,
      isBase: true,
    },
  })

  // Transform projects to convert Decimal to number for the component
  const transformedProjects = projects.map(project => ({
    ...project,
    milestones: project.milestones.map(m => ({
      ...m,
      amount: m.amount ? Number(m.amount) : null,
    })),
    supplierClaims: project.supplierClaims.map(c => ({
      ...c,
      amount: Number(c.amount),
    })),
    materialOrders: project.materialOrders.map(o => ({
      ...o,
      amount: Number(o.amount),
    })),
  }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link
                href="/scenarios"
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to Scenarios
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{scenario.name}</h1>
                <p className="text-gray-600">
                  {scenario.isBase ? 'Base Forecast' : 'What-if Scenario'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {!scenario.isBase && (
                <Link
                  href={`/forecast?scenario=${scenario.id}`}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  View Forecast
                </Link>
              )}
              <Link
                href="/forecast"
                className="text-gray-600 hover:text-gray-900"
              >
                Forecast
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {scenario.description && (
          <div className="mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Description</h2>
              <p className="text-gray-600">{scenario.description}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scenario Editor */}
          <div>
            <ScenarioEditor 
              scenario={scenario}
              projects={transformedProjects}
            />
          </div>

          {/* Scenario Comparison */}
          {!scenario.isBase && baseScenario && (
            <div>
              <ScenarioComparison 
                scenario={scenario}
                baseScenario={baseScenario}
              />
            </div>
          )}
        </div>

        {/* Scenario Shifts */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                Scenario Adjustments ({scenario.scenarioShifts.length})
              </h2>
            </div>
            
            {scenario.scenarioShifts.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto h-12 w-12 text-gray-400">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                </div>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No adjustments yet</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Add adjustments to model different outcomes for this scenario.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {scenario.scenarioShifts.map((shift) => (
                  <div key={shift.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {shift.entityType.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {shift.entityId}
                          </span>
                        </div>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                          {shift.daysShift !== 0 && (
                            <span>
                              Date: {shift.daysShift > 0 ? '+' : ''}{shift.daysShift} days
                            </span>
                          )}
                          {shift.amountShift && (
                            <span>
                              Amount: {shift.amountShift > 0 ? '+' : ''}${shift.amountShift.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <button className="text-red-600 hover:text-red-800 text-sm">
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
