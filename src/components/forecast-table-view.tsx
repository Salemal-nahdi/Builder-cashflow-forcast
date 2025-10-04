'use client'

import { useState } from 'react'

interface ForecastPeriod {
  month: string
  income: number
  outgo: number
  net: number
  balance: number
  projectCosts?: number
  overheadCosts?: number
}

interface ForecastTableViewProps {
  data: ForecastPeriod[]
}

export function ForecastTableView({ data }: ForecastTableViewProps) {
  const [sortColumn, setSortColumn] = useState<keyof ForecastPeriod | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (column: keyof ForecastPeriod) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const sortedData = [...data].sort((a, b) => {
    if (!sortColumn) return 0
    
    const aVal = a[sortColumn]
    const bVal = b[sortColumn]
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal
    }
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortDirection === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    
    return 0
  })

  const exportToCSV = () => {
    const headers = ['Period', 'Income', 'Project Costs', 'Overheads', 'Total Outgo', 'Net Cashflow', 'Balance']
    const rows = data.map(period => [
      period.month,
      period.income,
      period.projectCosts || 0,
      period.overheadCosts || 0,
      period.outgo,
      period.net,
      period.balance,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cashflow-forecast-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const SortIcon = ({ column }: { column: keyof ForecastPeriod }) => {
    if (sortColumn !== column) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      )
    }
    
    return sortDirection === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )
  }

  const totals = data.reduce((acc, period) => ({
    income: acc.income + period.income,
    projectCosts: acc.projectCosts + (period.projectCosts || 0),
    overheadCosts: acc.overheadCosts + (period.overheadCosts || 0),
    outgo: acc.outgo + period.outgo,
    net: acc.net + period.net,
  }), { income: 0, projectCosts: 0, overheadCosts: 0, outgo: 0, net: 0 })

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header with Export Button */}
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Cashflow Forecast Table</h3>
        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export CSV</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                onClick={() => handleSort('month')}
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center space-x-1">
                  <span>Period</span>
                  <SortIcon column="month" />
                </div>
              </th>
              <th
                onClick={() => handleSort('income')}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Income</span>
                  <SortIcon column="income" />
                </div>
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Project Costs
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Overheads
              </th>
              <th
                onClick={() => handleSort('outgo')}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Total Outgo</span>
                  <SortIcon column="outgo" />
                </div>
              </th>
              <th
                onClick={() => handleSort('net')}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Net Cashflow</span>
                  <SortIcon column="net" />
                </div>
              </th>
              <th
                onClick={() => handleSort('balance')}
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Balance</span>
                  <SortIcon column="balance" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((period, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {period.month}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 font-medium">
                  ${period.income.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-600">
                  ${(period.projectCosts || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-600">
                  ${(period.overheadCosts || 0).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-700 font-medium">
                  ${period.outgo.toLocaleString()}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-semibold ${
                  period.net >= 0 ? 'text-green-700' : 'text-red-700'
                }`}>
                  {period.net >= 0 ? '+' : ''}${period.net.toLocaleString()}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                  period.balance >= 0 ? 'text-blue-700' : 'text-red-700'
                }`}>
                  ${period.balance.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-100 border-t-2 border-gray-300">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                TOTALS
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-700 font-bold">
                ${totals.income.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-700 font-bold">
                ${totals.projectCosts.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-orange-700 font-bold">
                ${totals.overheadCosts.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-red-700 font-bold">
                ${totals.outgo.toLocaleString()}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${
                totals.net >= 0 ? 'text-green-700' : 'text-red-700'
              }`}>
                {totals.net >= 0 ? '+' : ''}${totals.net.toLocaleString()}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                —
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Avg Monthly Income</div>
            <div className="font-semibold text-green-700">
              ${(totals.income / data.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Avg Monthly Costs</div>
            <div className="font-semibold text-red-700">
              ${(totals.outgo / data.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Avg Net Cashflow</div>
            <div className={`font-semibold ${totals.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              ${(totals.net / data.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Final Balance</div>
            <div className={`font-semibold ${data[data.length - 1]?.balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              ${data[data.length - 1]?.balance.toLocaleString()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
