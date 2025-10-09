import { ForecastByProject } from '@/components/forecast-by-project'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function ForecastPage() {
  // Fetch forecast data
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/forecast`, {
    cache: 'no-store'
  })

  if (!response.ok) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading forecast data</p>
        </div>
      </div>
    )
  }

  const data = await response.json()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cashflow Forecast</h1>
          <p className="text-gray-500 mt-1">6-month cashflow by project</p>
        </div>
        <div className="flex space-x-4">
          <Link
            href="/projects/new"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Add Project
          </Link>
          <Link
            href="/settings/xero"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
          >
            Xero Settings
          </Link>
        </div>
      </div>

      {/* Forecast Table */}
      <ForecastByProject projects={data.projects} totals={data.totals} />
    </div>
  )
}

