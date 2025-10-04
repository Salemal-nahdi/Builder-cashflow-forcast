'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface VarianceMatch {
  id: string
  cashEventId: string
  xeroTransactionId: string
  xeroTransactionType: string
  amountVariance: number
  timingVariance: number
  confidenceScore: number
  status: string
  createdAt: Date
  cashEvent: {
    type: string
    amount: number
    scheduledDate: Date
    actualDate: Date | null
    sourceType: string
    sourceId: string
    project: {
      name: string
    } | null
  }
}

interface VarianceTableProps {
  varianceMatches: VarianceMatch[]
}

export function VarianceTable({ varianceMatches }: VarianceTableProps) {
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set())

  const handleSelectAll = () => {
    if (selectedMatches.size === varianceMatches.length) {
      setSelectedMatches(new Set())
    } else {
      setSelectedMatches(new Set(varianceMatches.map(m => m.id)))
    }
  }

  const handleSelectMatch = (matchId: string) => {
    const newSelected = new Set(selectedMatches)
    if (newSelected.has(matchId)) {
      newSelected.delete(matchId)
    } else {
      newSelected.add(matchId)
    }
    setSelectedMatches(newSelected)
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-100 text-green-800'
    if (score >= 0.6) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getConfidenceLabel = (score: number) => {
    if (score >= 0.8) return 'High'
    if (score >= 0.6) return 'Medium'
    return 'Low'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'matched':
        return 'bg-green-100 text-green-800'
      case 'disputed':
        return 'bg-red-100 text-red-800'
      case 'resolved':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getVarianceColor = (variance: number, isAmount: boolean = true) => {
    if (variance === 0) return 'text-gray-600'
    const isGood = isAmount ? variance > 0 : Math.abs(variance) < 7
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedMatches.size === varianceMatches.length && varianceMatches.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Project
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Item
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Forecast Amount
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Amount Variance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Timing Variance
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Confidence
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {varianceMatches.map((match) => (
            <tr key={match.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="checkbox"
                  checked={selectedMatches.has(match.id)}
                  onChange={() => handleSelectMatch(match.id)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  {match.cashEvent.project?.name || 'No Project'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {match.cashEvent.sourceType.replace('_', ' ')}
                </div>
                <div className="text-sm text-gray-500">
                  {match.cashEvent.sourceId}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {formatCurrency(match.cashEvent.amount)}
                </div>
                <div className="text-sm text-gray-500">
                  {format(match.cashEvent.scheduledDate, 'MMM dd, yyyy')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={`flex items-center space-x-1 ${getVarianceColor(match.amountVariance, true)}`}>
                  {getVarianceIcon(match.amountVariance, true)}
                  <span className="text-sm font-medium">
                    {formatCurrency(match.amountVariance)}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className={`flex items-center space-x-1 ${getVarianceColor(match.timingVariance, false)}`}>
                  {getVarianceIcon(match.timingVariance, false)}
                  <span className="text-sm font-medium">
                    {match.timingVariance} days
                  </span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfidenceColor(match.confidenceScore)}`}>
                  {getConfidenceLabel(match.confidenceScore)}
                </span>
                <div className="text-xs text-gray-500 mt-1">
                  {Math.round(match.confidenceScore * 100)}%
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(match.status)}`}>
                  {match.status}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  <button className="text-blue-600 hover:text-blue-900">
                    View
                  </button>
                  {match.status === 'matched' && (
                    <button className="text-red-600 hover:text-red-900">
                      Dispute
                    </button>
                  )}
                  {match.status === 'disputed' && (
                    <button className="text-green-600 hover:text-green-900">
                      Resolve
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bulk Actions */}
      {selectedMatches.size > 0 && (
        <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700">
              {selectedMatches.size} item{selectedMatches.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex space-x-2">
              <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
                Export Selected
              </button>
              <button className="px-3 py-1 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700">
                Mark as Disputed
              </button>
              <button className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700">
                Mark as Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
