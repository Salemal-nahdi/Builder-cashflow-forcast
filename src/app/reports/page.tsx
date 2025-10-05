import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ReportGenerator } from '@/components/report-generator'
import { ReportHistory } from '@/components/report-history'

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.organizationId) {
    redirect('/auth/signin')
  }

  const organizationId = session.user.organizationId

  // Get organization for header
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      settings: true,
    },
  })

  // Get recent report jobs
  const recentReports = await prisma.reportJob.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  // Get projects for report options
  const projects = await prisma.project.findMany({
    where: { organizationId },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Exports</h1>
              <p className="text-gray-600">{organization?.name}</p>
            </div>
            <div className="flex items-center space-x-4">
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
        {/* Report Generator */}
        <div className="mb-8">
          <ReportGenerator 
            organizationId={organizationId}
            projects={projects}
            organizationSettings={organization?.settings || null}
          />
        </div>

        {/* Report History */}
        <div className="mb-8">
          <ReportHistory reports={recentReports} />
        </div>

        {/* Quick Export Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/api/reports/forecast/csv"
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Quick CSV Export</h3>
                <p className="text-gray-600">Download current forecast as CSV</p>
              </div>
            </div>
          </Link>

          <Link
            href="/api/reports/variance/csv"
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
                <h3 className="text-lg font-medium text-gray-900">Variance Report</h3>
                <p className="text-gray-600">Export variance analysis as CSV</p>
              </div>
            </div>
          </Link>

          <Link
            href="/api/reports/consolidated/pdf"
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
                <h3 className="text-lg font-medium text-gray-900">Executive Summary</h3>
                <p className="text-gray-600">Generate branded PDF report</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
