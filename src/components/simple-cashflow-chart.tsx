'use client'

import { format, parseISO } from 'date-fns'

interface CashflowPeriod {
  date: Date
  income: number
  expenses: number
  netFlow: number
  balance: number
}

interface SimpleCashflowChartProps {
  periods: CashflowPeriod[]
  startingBalance?: number
}

export function SimpleCashflowChart({ periods, startingBalance = 0 }: SimpleCashflowChartProps) {
  if (!periods || periods.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2 text-sm text-gray-500">No cashflow data available</p>
          <p className="text-xs text-gray-400 mt-1">Add some projects with milestones to see your forecast</p>
        </div>
      </div>
    )
  }

  // Calculate running balance
  let runningBalance = startingBalance
  const periodsWithBalance = periods.map(p => {
    runningBalance += p.netFlow
    return {
      ...p,
      balance: runningBalance
    }
  })

  // Find max/min for scaling
  const allValues = periodsWithBalance.flatMap(p => [p.income, p.expenses, p.balance])
  const maxValue = Math.max(...allValues, 0)
  const minValue = Math.min(...allValues, 0)
  const range = maxValue - minValue
  const chartHeight = 200

  const scaleY = (value: number) => {
    if (range === 0) return chartHeight / 2
    return chartHeight - ((value - minValue) / range) * chartHeight
  }

  const chartWidth = 800
  const barWidth = chartWidth / (periods.length * 3)
  const groupWidth = chartWidth / periods.length

  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="relative" style={{ height: `${chartHeight + 60}px` }}>
        <svg width="100%" height={chartHeight + 60} className="overflow-visible">
          {/* Zero line */}
          {minValue < 0 && (
            <line
              x1="0"
              y1={scaleY(0)}
              x2="100%"
              y2={scaleY(0)}
              stroke="#94a3b8"
              strokeWidth="1"
              strokeDasharray="4"
            />
          )}

          {/* Bars for each period */}
          {periodsWithBalance.map((period, index) => {
            const xPos = (index / periods.length) * chartWidth
            const incomeHeight = Math.abs((period.income / range) * chartHeight)
            const expensesHeight = Math.abs((period.expenses / range) * chartHeight)

            return (
              <g key={index}>
                {/* Income bar (green) */}
                <rect
                  x={xPos}
                  y={scaleY(period.income)}
                  width={barWidth}
                  height={incomeHeight}
                  fill="#10b981"
                  opacity="0.8"
                  rx="2"
                />

                {/* Expenses bar (red) */}
                <rect
                  x={xPos + barWidth}
                  y={scaleY(Math.abs(period.expenses))}
                  width={barWidth}
                  height={expensesHeight}
                  fill="#ef4444"
                  opacity="0.8"
                  rx="2"
                />

                {/* Balance line point */}
                <circle
                  cx={((index / periods.length) * chartWidth) + (groupWidth / 2)}
                  cy={scaleY(period.balance)}
                  r="4"
                  fill="#3b82f6"
                />

                {/* Month label */}
                <text
                  x={((index / periods.length) * chartWidth) + (groupWidth / 2)}
                  y={chartHeight + 20}
                  textAnchor="middle"
                  className="text-xs fill-gray-600"
                >
                  {format(period.date, 'MMM')}
                </text>

                {/* Balance value */}
                <text
                  x={((index / periods.length) * chartWidth) + (groupWidth / 2)}
                  y={scaleY(period.balance) - 10}
                  textAnchor="middle"
                  className="text-xs fill-blue-600 font-medium"
                >
                  ${(period.balance / 1000).toFixed(0)}k
                </text>
              </g>
            )
          })}

          {/* Balance line */}
          <polyline
            points={periodsWithBalance.map((p, i) => {
              const x = ((i / periods.length) * chartWidth) + (groupWidth / 2)
              const y = scaleY(p.balance)
              return `${x},${y}`
            }).join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
          />
        </svg>
      </div>

      {/* Legend */}
      <div className="flex justify-center space-x-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-4 bg-green-500 opacity-80 rounded mr-2"></div>
          <span className="text-gray-600">Income</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-red-500 opacity-80 rounded mr-2"></div>
          <span className="text-gray-600">Expenses</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-4 bg-blue-500 rounded-full mr-2"></div>
          <span className="text-gray-600">Balance</span>
        </div>
      </div>

      {/* Summary Table */}
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Month</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Income</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Expenses</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Net Flow</th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {periodsWithBalance.map((period, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-2 whitespace-nowrap text-gray-900">
                  {format(period.date, 'MMM yyyy')}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-green-600">
                  ${(period.income || 0).toLocaleString()}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-red-600">
                  ${Math.abs(period.expenses || 0).toLocaleString()}
                </td>
                <td className={`px-4 py-2 whitespace-nowrap text-right font-medium ${
                  (period.netFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  ${(period.netFlow || 0).toLocaleString()}
                </td>
                <td className={`px-4 py-2 whitespace-nowrap text-right font-bold ${
                  (period.balance || 0) >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  ${(period.balance || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

