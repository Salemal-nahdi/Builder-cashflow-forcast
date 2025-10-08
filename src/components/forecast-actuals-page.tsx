'use client'

import { useState } from 'react'
import { format, subMonths, addMonths, parseISO } from 'date-fns'
import { ForecastDateRangePicker } from './forecast-date-range-picker'
import { ForecastActualsTable } from './forecast-actuals-table'

export function ForecastActualsPage() {
  const today = new Date()
  const [startDate, setStartDate] = useState(format(subMonths(today, 6), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(addMonths(today, 6), 'yyyy-MM-dd'))
  const [basis, setBasis] = useState<'cash' | 'accrual'>('accrual')

  const handleDateRangeChange = (newStartDate: string, newEndDate: string) => {
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  const handleBasisChange = (newBasis: 'cash' | 'accrual') => {
    setBasis(newBasis)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Cashflow Forecast vs Actuals</h1>
        <p className="text-gray-600 mt-1">
          Compare your forecasted cashflow with actual results from Xero
        </p>
      </div>

      <ForecastDateRangePicker
        startDate={startDate}
        endDate={endDate}
        basis={basis}
        onDateRangeChange={handleDateRangeChange}
        onBasisChange={handleBasisChange}
      />

      <ForecastActualsTable
        startDate={startDate}
        endDate={endDate}
        basis={basis}
      />
    </div>
  )
}
