'use client'

import { useEffect, useState } from 'react'

interface ForecastSummaryProps {
  organizationId: string
  scenarioId?: string
}

interface SummaryData {
  totalIncome: number
  totalOutgo: number
  netCashflow: number
  lowestBalance: number
  lowestBalanceDate: string | null
  negativeBalanceDays: number
  currentBalance: number
}

export function ForecastSummary({ organizationId, scenarioId }: ForecastSummaryProps) {
  const [data, setData] = useState<SummaryData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummaryData()
  }, [organizationId, scenarioId])

  const fetchSummaryData = async () => {
    setLoading(true)
    try {
      // Mock data for now - in real implementation, this would fetch from API
      const mockData: SummaryData = {
        totalIncome: 650000,
        totalOutgo: 520000,
        netCashflow: 130000,
        lowestBalance: 125000,
        lowestBalanceDate: '2024-01-31',
        negativeBalanceDays: 0,
        currentBalance: 125000,
      }
      
      setTimeout(() => {
        setData(mockData)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching summary data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!data) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-AU', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Current Balance */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Current Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.currentBalance)}
            </p>
          </div>
        </div>
      </div>

      {/* Net Cashflow */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Net Cashflow</p>
            <p className={`text-2xl font-bold ${data.netCashflow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {data.netCashflow >= 0 ? '+' : ''}{formatCurrency(data.netCashflow)}
            </p>
          </div>
        </div>
      </div>

      {/* Lowest Balance */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Lowest Balance</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(data.lowestBalance)}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(data.lowestBalanceDate)}
            </p>
          </div>
        </div>
      </div>

      {/* Risk Indicator */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              data.negativeBalanceDays > 0 ? 'bg-red-100' : 
              data.lowestBalance < data.currentBalance * 0.2 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <svg className={`w-5 h-5 ${
                data.negativeBalanceDays > 0 ? 'text-red-600' : 
                data.lowestBalance < data.currentBalance * 0.2 ? 'text-yellow-600' : 'text-green-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Cashflow Risk</p>
            <p className={`text-lg font-bold ${
              data.negativeBalanceDays > 0 ? 'text-red-600' : 
              data.lowestBalance < data.currentBalance * 0.2 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {data.negativeBalanceDays > 0 ? 'High Risk' : 
               data.lowestBalance < data.currentBalance * 0.2 ? 'Medium Risk' : 'Low Risk'}
            </p>
            {data.negativeBalanceDays > 0 && (
              <p className="text-xs text-red-500">
                {data.negativeBalanceDays} negative months
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
