import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { VarianceSummary } from '@/components/variance-summary'
import { VarianceTable } from '@/components/variance-table'
import { VarianceFilters } from '@/components/variance-filters'

interface SearchParams {
  project?: string
  confidence?: string
  status?: string
}

interface VariancePageProps {
  searchParams: SearchParams
}

export default async function VariancePage({ searchParams }: VariancePageProps) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    redirect('/auth/signin')
  }

  const organizationId = session.user.organizationId

  // Build where clause based on search params
  const where: any = { organizationId }
  
  if (searchParams.project) {
    where.projectId = searchParams.project
  }
  
  if (searchParams.confidence) {
    const threshold = parseFloat(searchParams.confidence)
    where.confidenceScore = { gte: threshold }
  }
  
  if (searchParams.status) {
    where.status = searchParams.status
  }

  // Get variance matches with related data
  const [varianceMatches, projects] = await Promise.all([
    prisma.varianceMatch.findMany({
      where,
      include: {
        cashEvent: {
          include: {
            project: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.project.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    }),
  ])

  // Get organization for header
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
  })

  // Transform variance matches to convert Decimal to number
  const transformedVarianceMatches = varianceMatches.map(match => ({
    ...match,
    amountVariance: Number(match.amountVariance),
    confidenceScore: Number(match.confidenceScore),
    cashEvent: match.cashEvent ? {
      ...match.cashEvent,
      amount: Number(match.cashEvent.amount),
    } : null,
  }))

  // Calculate summary statistics
  const totalMatches = transformedVarianceMatches.length
  const highConfidenceMatches = transformedVarianceMatches.filter(m => m.confidenceScore >= 0.8).length
  const mediumConfidenceMatches = transformedVarianceMatches.filter(m => m.confidenceScore >= 0.6 && m.confidenceScore < 0.8).length
  const lowConfidenceMatches = transformedVarianceMatches.filter(m => m.confidenceScore < 0.6).length

  const averageAmountVariance = totalMatches > 0 
    ? transformedVarianceMatches.reduce((sum, m) => sum + m.amountVariance, 0) / totalMatches 
    : 0

  const averageTimingVariance = totalMatches > 0 
    ? transformedVarianceMatches.reduce((sum, m) => sum + m.timingVariance, 0) / totalMatches 
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Variance Analysis</h1>
              <p className="text-gray-600">{organization?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Reconcile Now
              </button>
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
        {/* Summary Cards */}
        <div className="mb-8">
          <VarianceSummary 
            totalMatches={totalMatches}
            highConfidenceMatches={highConfidenceMatches}
            mediumConfidenceMatches={mediumConfidenceMatches}
            lowConfidenceMatches={lowConfidenceMatches}
            averageAmountVariance={averageAmountVariance}
            averageTimingVariance={averageTimingVariance}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <VarianceFilters 
            projects={projects}
            currentFilters={searchParams}
          />
        </div>

        {/* Variance Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Variance Matches ({totalMatches})
            </h2>
          </div>
          
          {varianceMatches.length === 0 ? (
            <div className="p-6 text-center">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No variance matches found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {Object.keys(searchParams).length > 0
                  ? 'Try adjusting your filters to see more matches.'
                  : 'Run reconciliation to match forecasted events with actual transactions.'}
              </p>
              {Object.keys(searchParams).length === 0 && (
                <div className="mt-6">
                  <button className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                    Start Reconciliation
                  </button>
                </div>
              )}
            </div>
          ) : (
            <VarianceTable varianceMatches={transformedVarianceMatches} />
          )}
        </div>
      </div>
    </div>
  )
}
