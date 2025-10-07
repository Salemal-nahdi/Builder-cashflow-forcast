'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { SimpleCashflowChart } from './simple-cashflow-chart'
import { ForecastTableView } from './forecast-table-view'
import { ForecastGanttView } from './forecast-gantt-view'
import { ForecastByProjectView } from './forecast-by-project-view'
import { ForecastViewControls } from './forecast-view-controls'

interface ForecastPageClientProps {
  forecastPeriods: any[]
  projects: any[]
  startingBalance: number
}

export function ForecastPageClient({ 
  forecastPeriods, 
  projects,
  startingBalance 
}: ForecastPageClientProps) {
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly')
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'table' | 'gantt' | 'by-project'>('bar')

  // Transform periods for chart
  const chartPeriods = forecastPeriods.map(p => ({
    date: p.startDate,
    income: Number(p.income),
    expenses: Number(p.outgo),
    netFlow: Number(p.net),
    balance: Number(p.balance)
  }))

  // Transform periods for table view
  const tableData = forecastPeriods.map((p, i) => ({
    month: format(p.startDate, 'MMM yyyy'),
    income: Number(p.income),
    outgo: Number(p.outgo),
    net: Number(p.net),
    balance: Number(p.balance)
  }))

  return (
    <div>
      {/* View Controls */}
      <div className="mb-6">
        <ForecastViewControls
          viewMode={viewMode}
          chartType={chartType}
          onViewModeChange={setViewMode}
          onChartTypeChange={setChartType}
        />
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-lg shadow p-6">
        {chartType === 'table' ? (
          <ForecastTableView data={tableData} />
        ) : chartType === 'gantt' ? (
          <ForecastGanttView projects={projects} />
        ) : chartType === 'by-project' ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">By-Project View Coming Soon</h3>
            <p className="mt-1 text-sm text-gray-500">
              This view is being updated to work with your project data. Use the other chart types for now.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {viewMode === 'weekly' ? '26-Week' : '6-Month'} Cashflow Forecast
              <span className="text-sm font-normal text-gray-600 ml-2">
                ({viewMode === 'weekly' ? 'Weekly' : 'Monthly'} view)
              </span>
            </h2>
            <SimpleCashflowChart 
              periods={chartPeriods}
              startingBalance={startingBalance}
            />
          </div>
        )}
      </div>
    </div>
  )
}

