'use client'

import { useState, useEffect } from 'react'
import { format, addMonths } from 'date-fns'
import { ForecastPageClient } from './forecast-page-client'

interface ForecastWithDateRangeProps {
  initialPeriods: any[]
  initialProjects: any[]
  initialBalance: number
}

export function ForecastWithDateRange({ 
  initialPeriods, 
  initialProjects,
  initialBalance 
}: ForecastWithDateRangeProps) {
  const today = format(new Date(), 'yyyy-MM-dd')
  const sixMonthsLater = format(addMonths(new Date(), 6), 'yyyy-MM-dd')
  
  const [startDate, setStartDate] = useState(today)
  const [endDate, setEndDate] = useState(sixMonthsLater)
  const [periods, setPeriods] = useState(initialPeriods)
  const [projects, setProjects] = useState(initialProjects)
  const [isLoading, setIsLoading] = useState(false)

  const fetchForecast = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/forecast?startDate=${startDate}&endDate=${endDate}`)
      if (response.ok) {
        const data = await response.json()
        setPeriods(data.periods)
        setProjects(data.projects)
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
      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="pt-6">
            <button
              onClick={handleApply}
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Update Forecast'}
            </button>
          </div>
          <div className="pt-6">
            <button
              onClick={() => {
                setStartDate(today)
                setEndDate(sixMonthsLater)
                setPeriods(initialPeriods)
                setProjects(initialProjects)
              }}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Forecast Display */}
      <ForecastPageClient 
        forecastPeriods={periods}
        projects={projects}
        startingBalance={initialBalance}
      />
    </div>
  )
}

