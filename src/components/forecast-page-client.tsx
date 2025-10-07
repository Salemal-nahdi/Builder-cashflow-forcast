'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { SimpleCashflowChart } from './simple-cashflow-chart'
import { ForecastTableView } from './forecast-table-view'
import { ForecastGanttView } from './forecast-gantt-view'
import { RealForecastByProject } from './real-forecast-by-project'
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
          <RealForecastByProject 
            forecastPeriods={forecastPeriods}
            projects={projects}
          />
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

