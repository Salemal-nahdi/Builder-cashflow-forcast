'use client'

import { useState } from 'react'
import { format, addMonths } from 'date-fns'
import { DashboardForecastSection } from './dashboard-forecast-section'

interface DashboardForecastWithDatesProps {
  initialPeriods: any[]
  initialProjects: any[]
  initialBalance: number
}

export function DashboardForecastWithDates({ 
  initialPeriods, 
  initialProjects,
  initialBalance 
}: DashboardForecastWithDatesProps) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const sixMonthsLater = format(addMonths(new Date(), 6), 'yyyy-MM-dd')
  
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(sixMonthsLater)
  const [periods, setPeriods] = useState(initialPeriods)
  const [projects, setProjects] = useState(initialProjects)
  const [isLoading, setIsLoading] = useState(false)
  const [showDatePicker, setShowDatePicker] = useState(false)

  const fetchForecast = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/forecast?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        setPeriods(data.periods)
        setProjects(data.projects)
        setShowDatePicker(false)
      }
    } catch (error) {
      console.error('Failed to fetch forecast:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApply = () => {
    if (startDate && endDate && new Date(endDate) > new Date(startDate)) {
      fetchForecast()
    }
  }

  return (
    <div>
      {/* Compact Date Range Toggle */}
      <div className="bg-white rounded-lg shadow mb-4 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              Forecast Period: {format(new Date(startDate), 'MMM d, yyyy')} - {format(new Date(endDate), 'MMM d, yyyy')}
            </span>
          </div>
          <button
            onClick={() => setShowDatePicker(!showDatePicker)}
            className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            {showDatePicker ? 'Close' : 'Change Dates'}
          </button>
        </div>

        {showDatePicker && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="pt-5">
                <button
                  onClick={handleApply}
                  disabled={isLoading}
                  className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : 'Update'}
                </button>
              </div>
              <div className="pt-5">
                <button
                  onClick={() => {
                    setStartDate(today)
                    setEndDate(sixMonthsLater)
                    setPeriods(initialPeriods)
                    setProjects(initialProjects)
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Forecast Display */}
      <DashboardForecastSection 
        forecastPeriods={periods}
        projects={projects}
        startingBalance={initialBalance}
      />
    </div>
  )
}

