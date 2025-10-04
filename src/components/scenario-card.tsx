import Link from 'next/link'
import { format } from 'date-fns'

interface Scenario {
  id: string
  name: string
  description: string | null
  isBase: boolean
  createdAt: Date
  updatedAt: Date
  _count: {
    scenarioShifts: number
  }
}

interface ScenarioCardProps {
  scenario: Scenario
}

export function ScenarioCard({ scenario }: ScenarioCardProps) {
  const getStatusColor = (isBase: boolean) => {
    if (isBase) {
      return 'bg-blue-100 text-blue-800'
    }
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (isBase: boolean) => {
    if (isBase) {
      return (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {scenario.name}
            </h3>
            {scenario.description && (
              <p className="text-sm text-gray-600 mb-3">
                {scenario.description}
              </p>
            )}
          </div>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(scenario.isBase)}`}>
            {getStatusIcon(scenario.isBase)}
            <span className="ml-1">{scenario.isBase ? 'Base' : 'Scenario'}</span>
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Adjustments</span>
            <span className="text-sm font-medium text-gray-900">
              {scenario._count.scenarioShifts}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Created</span>
            <span className="text-sm text-gray-900">
              {format(scenario.createdAt, 'MMM dd, yyyy')}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Last Updated</span>
            <span className="text-sm text-gray-900">
              {format(scenario.updatedAt, 'MMM dd, yyyy')}
            </span>
          </div>
        </div>

        <div className="mt-6 flex space-x-2">
          <Link
            href={`/scenarios/${scenario.id}`}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 text-center"
          >
            {scenario.isBase ? 'View' : 'Edit'}
          </Link>
          <Link
            href={`/forecast?scenario=${scenario.id}`}
            className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-center"
          >
            Compare
          </Link>
        </div>
      </div>
    </div>
  )
}
