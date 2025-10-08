'use client'

import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'

interface ForecastPeriod {
  startDate: string
  endDate: string
  income: number
  outgo: number
  net: number
  balance: number
  actualIncome?: number
  actualOutgo?: number
  actualNet?: number
  isHistorical?: boolean
}

interface ForecastActualsData {
  periods: ForecastPeriod[]
  summary: {
    totalForecastIncome: number
    totalForecastOutgo: number
    totalForecastNet: number
    totalActualIncome: number
    totalActualOutgo: number
    totalActualNet: number
    historicalPeriodsCount: number
    futurePeriodsCount: number
  }
  basis: 'cash' | 'accrual'
  dateRange: {
    startDate: string
    endDate: string
  }
}

interface ForecastActualsTableProps {
  startDate: string
  endDate: string
  basis: 'cash' | 'accrual'
  scenarioId?: string
}

export function ForecastActualsTable({ startDate, endDate, basis, scenarioId }: ForecastActualsTableProps) {
  const [data, setData] = useState<ForecastActualsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const params = new URLSearchParams({
          startDate,
          endDate,
          basis,
          ...(scenarioId && { scenarioId }),
        })

        const response = await fetch(`/api/forecast/actuals?${params}`)
        const result = await response.json()

        if (result.success) {
          setData(result.data)
        } else {
          setError(result.error || 'Failed to fetch forecast data')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [startDate, endDate, basis, scenarioId])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600">
          <h3 className="font-medium">Error loading forecast</h3>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500">No forecast data available</p>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getVarianceColor = (forecast: number, actual: number) => {
    if (actual === 0) return 'text-gray-500'
    const variance = ((actual - forecast) / Math.abs(forecast)) * 100
    if (Math.abs(variance) < 5) return 'text-green-600'
    if (Math.abs(variance) < 15) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cashflow Forecast vs Actuals</h2>
            <p className="text-sm text-gray-600">
              {data.dateRange.startDate && data.dateRange.endDate ? 
                `${format(parseISO(data.dateRange.startDate), 'MMM dd, yyyy')} - ${format(parseISO(data.dateRange.endDate), 'MMM dd, yyyy')}` :
                'Invalid date range'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              basis === 'accrual' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            }`}>
              {basis === 'accrual' ? 'Accrual Basis' : 'Cash Basis'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Total Forecast</p>
            <p className="font-semibold">{formatCurrency(data.summary.totalForecastNet)}</p>
          </div>
          <div>
            <p className="text-gray-600">Total Actuals</p>
            <p className="font-semibold">{formatCurrency(data.summary.totalActualNet)}</p>
          </div>
          <div>
            <p className="text-gray-600">Historical Periods</p>
            <p className="font-semibold">{data.summary.historicalPeriodsCount}</p>
          </div>
          <div>
            <p className="text-gray-600">Future Periods</p>
            <p className="font-semibold">{data.summary.futurePeriodsCount}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Period
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Forecast Income
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actual Income
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Forecast Outgo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actual Outgo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Forecast Net
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actual Net
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Variance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.periods.map((period, index) => {
              const variance = period.actualNet !== undefined ? period.actualNet - period.net : 0
              const variancePercent = period.net !== 0 ? (variance / Math.abs(period.net)) * 100 : 0
              
              return (
                <tr key={index} className={period.isHistorical ? 'bg-blue-50' : ''}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {period.startDate ? format(parseISO(period.startDate), 'MMM yyyy') : 'Invalid Date'}
                    {period.isHistorical && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Actual
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(period.income)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {period.actualIncome !== undefined ? formatCurrency(period.actualIncome) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(period.outgo)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {period.actualOutgo !== undefined ? formatCurrency(period.actualOutgo) : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(period.net)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {period.actualNet !== undefined ? formatCurrency(period.actualNet) : '-'}
                  </td>
                  <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    period.actualNet !== undefined ? getVarianceColor(period.net, period.actualNet) : 'text-gray-500'
                  }`}>
                    {period.actualNet !== undefined ? (
                      <div>
                        <div>{formatCurrency(variance)}</div>
                        <div className="text-xs">({variancePercent.toFixed(1)}%)</div>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
