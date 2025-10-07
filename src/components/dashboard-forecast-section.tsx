'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { SimpleCashflowChart } from './simple-cashflow-chart'
import { ForecastTableView } from './forecast-table-view'
import { ForecastGanttView } from './forecast-gantt-view'
import { ForecastByProjectView } from './forecast-by-project-view'
import { ForecastViewControls } from './forecast-view-controls'

interface DashboardForecastSectionProps {
  forecastPeriods: any[]
  projects: any[]
  startingBalance: number
}

export function DashboardForecastSection({ 
  forecastPeriods, 
  projects,
  startingBalance 
}: DashboardForecastSectionProps) {
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
    <div className="bg-white p-6 rounded-lg shadow mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">6-Month Cashflow Forecast</h2>
        <div className="scale-90 origin-right">
          <ForecastViewControls
            viewMode={viewMode}
            chartType={chartType}
            onViewModeChange={setViewMode}
            onChartTypeChange={setChartType}
          />
        </div>
      </div>

      {chartType === 'table' ? (
        <ForecastTableView data={tableData} />
      ) : chartType === 'gantt' ? (
        <ForecastGanttView projects={projects} />
      ) : chartType === 'by-project' ? (
        <ForecastByProjectView 
          projects={projects}
          viewMode={viewMode}
          overheadCosts={{ monthly: [] }}
          startingBalance={startingBalance}
        />
      ) : (
        <SimpleCashflowChart 
          periods={chartPeriods}
          startingBalance={startingBalance}
        />
      )}
    </div>
  )
}

