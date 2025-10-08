'use client'

import { useState } from 'react'
import { format, subMonths, addMonths } from 'date-fns'

interface ForecastDateRangePickerProps {
  startDate: string
  endDate: string
  basis: 'cash' | 'accrual'
  onDateRangeChange: (startDate: string, endDate: string) => void
  onBasisChange: (basis: 'cash' | 'accrual') => void
}

export function ForecastDateRangePicker({
  startDate,
  endDate,
  basis,
  onDateRangeChange,
  onBasisChange,
}: ForecastDateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handlePreset = (preset: string) => {
    const today = new Date()
    let newStartDate: Date
    let newEndDate: Date

    switch (preset) {
      case '3months':
        newStartDate = subMonths(today, 3)
        newEndDate = addMonths(today, 3)
        break
      case '6months':
        newStartDate = subMonths(today, 6)
        newEndDate = addMonths(today, 6)
        break
      case '12months':
        newStartDate = subMonths(today, 12)
        newEndDate = addMonths(today, 12)
        break
      case 'year':
        newStartDate = new Date(today.getFullYear(), 0, 1)
        newEndDate = new Date(today.getFullYear(), 11, 31)
        break
      case 'nextyear':
        newStartDate = new Date(today.getFullYear() + 1, 0, 1)
        newEndDate = new Date(today.getFullYear() + 1, 11, 31)
        break
      default:
        return
    }

    onDateRangeChange(
      format(newStartDate, 'yyyy-MM-dd'),
      format(newEndDate, 'yyyy-MM-dd')
    )
    setIsOpen(false)
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Date Range */}
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onDateRangeChange(e.target.value, endDate)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => onDateRangeChange(startDate, e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Presets */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Quick Presets
              <svg className="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                <div className="py-1">
                  <button
                    onClick={() => handlePreset('3months')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Last 3 months + Next 3 months
                  </button>
                  <button
                    onClick={() => handlePreset('6months')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Last 6 months + Next 6 months
                  </button>
                  <button
                    onClick={() => handlePreset('12months')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Last 12 months + Next 12 months
                  </button>
                  <button
                    onClick={() => handlePreset('year')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    This Year
                  </button>
                  <button
                    onClick={() => handlePreset('nextyear')}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Next Year
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Basis Toggle */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Basis:</span>
            <div className="flex rounded-md shadow-sm">
              <button
                onClick={() => onBasisChange('accrual')}
                className={`px-3 py-2 text-sm font-medium rounded-l-md border ${
                  basis === 'accrual'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Accrual
              </button>
              <button
                onClick={() => onBasisChange('cash')}
                className={`px-3 py-2 text-sm font-medium rounded-r-md border-t border-r border-b ${
                  basis === 'cash'
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                Cash
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Accrual Basis:</strong> Shows income/expenses when invoices/bills are created.
              <br />
              <strong>Cash Basis:</strong> Shows income/expenses when payments are received/made.
              <br />
              Historical periods show actuals from Xero, future periods show forecasts only.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
