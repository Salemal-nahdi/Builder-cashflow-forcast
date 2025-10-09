'use client'

import { format } from 'date-fns'

interface MonthData {
  month: string
  income: number
  costs: number
  net: number
}

interface ProjectForecast {
  id: string
  name: string
  months: MonthData[]
}

interface ForecastTotals {
  month: string
  income: number
  costs: number
  net: number
  balance: number
}

interface Props {
  projects: ProjectForecast[]
  totals: ForecastTotals[]
}

export function ForecastByProject({ projects, totals }: Props) {
  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Projects Yet</h3>
        <p className="text-gray-500">Create your first project to see cashflow forecasts</p>
      </div>
    )
  }

  const months = totals.map(t => t.month)

  // Format month for display
  const formatMonth = (month: string) => {
    const date = new Date(month + '-01')
    return format(date, 'MMM yy')
  }

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="sticky left-0 z-10 bg-gray-50 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project
              </th>
              {months.map(month => (
                <th key={month} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  {formatMonth(month)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Project Rows */}
            {projects.map(project => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="sticky left-0 z-10 bg-white px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {project.name}
                </td>
                {project.months.map(monthData => (
                  <td key={monthData.month} className="px-6 py-4 text-center">
                    <div className="space-y-1">
                      {monthData.income > 0 && (
                        <div className="text-sm text-green-600 font-medium">
                          +{formatCurrency(monthData.income)}
                        </div>
                      )}
                      {monthData.costs > 0 && (
                        <div className="text-sm text-red-600">
                          -{formatCurrency(monthData.costs)}
                        </div>
                      )}
                      {(monthData.income > 0 || monthData.costs > 0) && (
                        <div className={`text-sm font-semibold ${monthData.net >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                          = {formatCurrency(monthData.net)}
                        </div>
                      )}
                      {monthData.income === 0 && monthData.costs === 0 && (
                        <div className="text-sm text-gray-400">-</div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
            
            {/* Totals Row */}
            <tr className="bg-gray-100 font-bold">
              <td className="sticky left-0 z-10 bg-gray-100 px-6 py-4 text-sm text-gray-900">
                TOTAL
              </td>
              {totals.map(total => (
                <td key={total.month} className="px-6 py-4 text-center">
                  <div className={`text-sm font-bold ${total.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatCurrency(total.net)}
                  </div>
                </td>
              ))}
            </tr>
            
            {/* Balance Row */}
            <tr className="bg-blue-50 font-bold">
              <td className="sticky left-0 z-10 bg-blue-50 px-6 py-4 text-sm text-blue-900">
                BALANCE
              </td>
              {totals.map(total => (
                <td key={total.month} className="px-6 py-4 text-center">
                  <div className={`text-sm font-bold ${total.balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    {formatCurrency(total.balance)}
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

