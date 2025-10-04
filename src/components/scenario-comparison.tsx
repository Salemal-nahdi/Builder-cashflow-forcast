'use client'

import { useEffect, useState } from 'react'

interface Scenario {
  id: string
  name: string
  isBase: boolean
}

interface ScenarioComparisonProps {
  scenario: Scenario
  baseScenario: Scenario
}

interface ComparisonData {
  totalIncome: number
  totalOutgo: number
  netCashflow: number
  lowestBalance: number
  negativeBalanceDays: number
  incomeChange: number
  outgoChange: number
  netChange: number
  balanceChange: number
}

export function ScenarioComparison({ scenario, baseScenario }: ScenarioComparisonProps) {
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComparisonData()
  }, [scenario.id, baseScenario.id])

  const fetchComparisonData = async () => {
    setLoading(true)
    try {
      // Mock data for now - in real implementation, this would fetch from API
      const mockData: ComparisonData = {
        totalIncome: 650000,
        totalOutgo: 520000,
        netCashflow: 130000,
        lowestBalance: 125000,
        negativeBalanceDays: 0,
        incomeChange: -25000, // -3.7%
        outgoChange: 15000,   // +2.9%
        netChange: -40000,    // -30.8%
        balanceChange: -40000, // -32.0%
      }
      
      setTimeout(() => {
        setData(mockData)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching comparison data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
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

  const formatPercentage = (change: number, base: number) => {
    const percentage = base !== 0 ? (change / base) * 100 : 0
    return `${change >= 0 ? '+' : ''}${percentage.toFixed(1)}%`
  }

  const getChangeColor = (change: number, isPositive: boolean = true) => {
    if (change === 0) return 'text-gray-600'
    const isGood = isPositive ? change > 0 : change < 0
    return isGood ? 'text-green-600' : 'text-red-600'
  }

  const getChangeIcon = (change: number, isPositive: boolean = true) => {
    if (change === 0) return null
    const isGood = isPositive ? change > 0 : change < 0
    return isGood ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17l9.2-9.2M17 17V7H7" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7l-9.2 9.2M7 7v10h10" />
      </svg>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        vs Base Scenario
      </h2>
      
      <div className="space-y-4">
        {/* Total Income */}
        <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-green-800">Total Income</p>
            <p className="text-lg font-bold text-green-900">
              {formatCurrency(data.totalIncome)}
            </p>
          </div>
          <div className="text-right">
            <div className={`flex items-center space-x-1 ${getChangeColor(data.incomeChange, true)}`}>
              {getChangeIcon(data.incomeChange, true)}
              <span className="text-sm font-medium">
                {formatCurrency(data.incomeChange)}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {formatPercentage(data.incomeChange, data.totalIncome - data.incomeChange)}
            </p>
          </div>
        </div>

        {/* Total Outgo */}
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-red-800">Total Outgo</p>
            <p className="text-lg font-bold text-red-900">
              {formatCurrency(data.totalOutgo)}
            </p>
          </div>
          <div className="text-right">
            <div className={`flex items-center space-x-1 ${getChangeColor(data.outgoChange, false)}`}>
              {getChangeIcon(data.outgoChange, false)}
              <span className="text-sm font-medium">
                {formatCurrency(data.outgoChange)}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {formatPercentage(data.outgoChange, data.totalOutgo - data.outgoChange)}
            </p>
          </div>
        </div>

        {/* Net Cashflow */}
        <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-blue-800">Net Cashflow</p>
            <p className="text-lg font-bold text-blue-900">
              {formatCurrency(data.netCashflow)}
            </p>
          </div>
          <div className="text-right">
            <div className={`flex items-center space-x-1 ${getChangeColor(data.netChange, true)}`}>
              {getChangeIcon(data.netChange, true)}
              <span className="text-sm font-medium">
                {formatCurrency(data.netChange)}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {formatPercentage(data.netChange, data.netCashflow - data.netChange)}
            </p>
          </div>
        </div>

        {/* Lowest Balance */}
        <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-yellow-800">Lowest Balance</p>
            <p className="text-lg font-bold text-yellow-900">
              {formatCurrency(data.lowestBalance)}
            </p>
          </div>
          <div className="text-right">
            <div className={`flex items-center space-x-1 ${getChangeColor(data.balanceChange, true)}`}>
              {getChangeIcon(data.balanceChange, true)}
              <span className="text-sm font-medium">
                {formatCurrency(data.balanceChange)}
              </span>
            </div>
            <p className="text-xs text-gray-600">
              {formatPercentage(data.balanceChange, data.lowestBalance - data.balanceChange)}
            </p>
          </div>
        </div>
      </div>

      {/* Risk Assessment */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Risk Assessment</h3>
        <div className="space-y-2">
          {data.negativeBalanceDays > 0 ? (
            <div className="flex items-center space-x-2 text-red-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm">
                {data.negativeBalanceDays} months with negative balance
              </span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-green-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">No negative balance periods</span>
            </div>
          )}
          
          {data.netChange < -20000 && (
            <div className="flex items-center space-x-2 text-yellow-600">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span className="text-sm">Significant cashflow reduction</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
