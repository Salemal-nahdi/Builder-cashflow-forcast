'use client'

import { useEffect, useState } from 'react'
import { format, startOfMonth, endOfMonth, addMonths } from 'date-fns'

interface CashflowOverviewProps {
  organizationId: string
}

interface CashflowData {
  currentBalance: number
  monthlyData: Array<{
    month: string
    income: number
    outgo: number
    net: number
    balance: number
  }>
  upcomingMilestones: Array<{
    name: string
    amount: number
    date: string
    project: string
  }>
  upcomingPayments: Array<{
    name: string
    amount: number
    date: string
    project: string
  }>
}

export function CashflowOverview({ organizationId }: CashflowOverviewProps) {
  const [data, setData] = useState<CashflowData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mock data for now - in real implementation, this would fetch from API
    const mockData: CashflowData = {
      currentBalance: 125000,
      monthlyData: [
        { month: 'Jan 2024', income: 45000, outgo: 32000, net: 13000, balance: 125000 },
        { month: 'Feb 2024', income: 52000, outgo: 38000, net: 14000, balance: 139000 },
        { month: 'Mar 2024', income: 48000, outgo: 41000, net: 7000, balance: 146000 },
        { month: 'Apr 2024', income: 55000, outgo: 45000, net: 10000, balance: 156000 },
        { month: 'May 2024', income: 60000, outgo: 50000, net: 10000, balance: 166000 },
        { month: 'Jun 2024', income: 58000, outgo: 52000, net: 6000, balance: 172000 },
      ],
      upcomingMilestones: [
        { name: 'Foundation Complete', amount: 67500, date: '2024-02-15', project: 'Smith Family Home' },
        { name: 'Frame Complete', amount: 112500, date: '2024-04-01', project: 'Smith Family Home' },
        { name: 'Lock-up', amount: 90000, date: '2024-05-15', project: 'Smith Family Home' },
      ],
      upcomingPayments: [
        { name: 'Office Rent', amount: 3500, date: '2024-02-01', project: 'Overhead' },
        { name: 'Insurance', amount: 12000, date: '2024-03-01', project: 'Overhead' },
        { name: 'Payroll', amount: 8500, date: '2024-02-05', project: 'Overhead' },
      ],
    }

    setTimeout(() => {
      setData(mockData)
      setLoading(false)
    }, 1000)
  }, [organizationId])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const currentMonth = data.monthlyData[data.monthlyData.length - 1]
  const nextMonth = data.monthlyData[data.monthlyData.length - 2]

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Cashflow Overview</h2>
          <p className="text-gray-600">Current balance and upcoming cash movements</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-bold text-gray-900">
            ${data.currentBalance.toLocaleString()}
          </p>
          <p className="text-sm text-gray-600">Current Balance</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* Current Month Net */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">This Month Net</p>
              <p className="text-2xl font-bold text-blue-900">
                ${currentMonth.net.toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Income */}
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Next 30 Days Income</p>
              <p className="text-2xl font-bold text-green-900">
                ${data.upcomingMilestones.reduce((sum, m) => sum + m.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">Next 30 Days Payments</p>
              <p className="text-2xl font-bold text-red-900">
                ${data.upcomingPayments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Milestones */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Milestones</h3>
          <div className="space-y-2">
            {data.upcomingMilestones.slice(0, 3).map((milestone, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{milestone.name}</p>
                  <p className="text-sm text-gray-600">{milestone.project}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-900">
                    +${milestone.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(milestone.date), 'MMM dd')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Payments */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Payments</h3>
          <div className="space-y-2">
            {data.upcomingPayments.slice(0, 3).map((payment, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{payment.name}</p>
                  <p className="text-sm text-gray-600">{payment.project}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-900">
                    -${payment.amount.toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {format(new Date(payment.date), 'MMM dd')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
