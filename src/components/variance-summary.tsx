interface VarianceSummaryProps {
  totalMatches: number
  highConfidenceMatches: number
  mediumConfidenceMatches: number
  lowConfidenceMatches: number
  averageAmountVariance: number
  averageTimingVariance: number
}

export function VarianceSummary({
  totalMatches,
  highConfidenceMatches,
  mediumConfidenceMatches,
  lowConfidenceMatches,
  averageAmountVariance,
  averageTimingVariance,
}: VarianceSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getVarianceColor = (variance: number, isAmount: boolean = true) => {
    if (variance === 0) return 'text-gray-600'
    const isGood = isAmount ? variance > 0 : Math.abs(variance) < 7 // 7 days tolerance for timing
    return isGood ? 'text-green-600' : 'text-red-600'
  }

  const getVarianceIcon = (variance: number, isAmount: boolean = true) => {
    if (variance === 0) return null
    const isGood = isAmount ? variance > 0 : Math.abs(variance) < 7
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Matches */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Total Matches</p>
            <p className="text-2xl font-bold text-gray-900">{totalMatches}</p>
          </div>
        </div>
      </div>

      {/* High Confidence Matches */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">High Confidence</p>
            <p className="text-2xl font-bold text-green-600">{highConfidenceMatches}</p>
            <p className="text-xs text-gray-500">
              {totalMatches > 0 ? Math.round((highConfidenceMatches / totalMatches) * 100) : 0}% of total
            </p>
          </div>
        </div>
      </div>

      {/* Average Amount Variance */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Avg Amount Variance</p>
            <div className="flex items-center space-x-1">
              {getVarianceIcon(averageAmountVariance, true)}
              <p className={`text-lg font-bold ${getVarianceColor(averageAmountVariance, true)}`}>
                {formatCurrency(averageAmountVariance)}
              </p>
            </div>
            <p className="text-xs text-gray-500">
              {averageAmountVariance > 0 ? 'Actual higher' : averageAmountVariance < 0 ? 'Forecast higher' : 'Perfect match'}
            </p>
          </div>
        </div>
      </div>

      {/* Average Timing Variance */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-600">Avg Timing Variance</p>
            <div className="flex items-center space-x-1">
              {getVarianceIcon(averageTimingVariance, false)}
              <p className={`text-lg font-bold ${getVarianceColor(averageTimingVariance, false)}`}>
                {Math.round(averageTimingVariance)} days
              </p>
            </div>
            <p className="text-xs text-gray-500">
              {averageTimingVariance > 0 ? 'Actual later' : averageTimingVariance < 0 ? 'Actual earlier' : 'Perfect timing'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
