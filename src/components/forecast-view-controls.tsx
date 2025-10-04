'use client'

interface ForecastViewControlsProps {
  viewMode: 'monthly' | 'weekly'
  chartType: 'bar' | 'line' | 'area' | 'table' | 'gantt' | 'by-project'
  onViewModeChange: (mode: 'monthly' | 'weekly') => void
  onChartTypeChange: (type: 'bar' | 'line' | 'area' | 'table' | 'gantt' | 'by-project') => void
}

export function ForecastViewControls({
  viewMode,
  chartType,
  onViewModeChange,
  onChartTypeChange,
}: ForecastViewControlsProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">View:</span>
          
          {/* Time Granularity Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewModeChange('monthly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'monthly'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => onViewModeChange('weekly')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                viewMode === 'weekly'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Weekly
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700">Chart Type:</span>
          
          {/* Chart Type Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onChartTypeChange('bar')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                chartType === 'bar'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Bar Chart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
            
            <button
              onClick={() => onChartTypeChange('line')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                chartType === 'line'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Line Chart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
            </button>
            
            <button
              onClick={() => onChartTypeChange('area')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                chartType === 'area'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Area Chart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            
            <button
              onClick={() => onChartTypeChange('table')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                chartType === 'table'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Table View"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
            
            <button
              onClick={() => onChartTypeChange('gantt')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                chartType === 'gantt'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="Gantt Timeline"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            
            <button
              onClick={() => onChartTypeChange('by-project')}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                chartType === 'by-project'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="By Project Breakdown"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mt-3 text-xs text-gray-600">
        {chartType === 'bar' && 'Bar chart showing income vs costs by period'}
        {chartType === 'line' && 'Line chart tracking cashflow trends over time'}
        {chartType === 'area' && 'Stacked area chart showing cumulative cashflow'}
        {chartType === 'table' && 'Detailed table view with export capability'}
        {chartType === 'gantt' && 'Timeline view showing project milestones and payments'}
        {chartType === 'by-project' && 'Breakdown showing income and costs per project'}
      </div>
    </div>
  )
}
