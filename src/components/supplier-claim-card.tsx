import { format } from 'date-fns'
import { Decimal } from '@prisma/client/runtime/library'

interface SupplierClaim {
  id: string
  supplierName: string
  description: string | null
  amount: Decimal
  expectedDate: Date
  actualDate: Date | null
  status: string
  xeroBillId: string | null
}

interface SupplierClaimCardProps {
  claim: SupplierClaim
}

export function SupplierClaimCard({ claim }: SupplierClaimCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'invoiced':
        return 'bg-blue-100 text-blue-800'
      case 'overdue':
        return 'bg-red-100 text-red-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      case 'invoiced':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      case 'overdue':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        )
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
    }
  }

  const isOverdue = claim.status === 'pending' && claim.expectedDate < new Date()
  const displayStatus = isOverdue ? 'overdue' : claim.status

  return (
    <div className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">{claim.supplierName}</h3>
          {claim.description && (
            <p className="text-sm text-gray-600 mb-2">{claim.description}</p>
          )}
        </div>
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(displayStatus)}`}>
          {getStatusIcon(displayStatus)}
          <span className="ml-1">{displayStatus}</span>
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Amount</span>
          <span className="font-semibold text-gray-900">
            ${Number(claim.amount).toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Expected Date</span>
          <span className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
            {format(claim.expectedDate, 'MMM dd, yyyy')}
          </span>
        </div>

        {claim.actualDate && (
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Actual Date</span>
            <span className="text-sm text-gray-900">
              {format(claim.actualDate, 'MMM dd, yyyy')}
            </span>
          </div>
        )}

        {claim.xeroBillId && (
          <div className="pt-2 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Xero Bill</span>
              <span className="text-xs text-blue-600 font-mono">
                {claim.xeroBillId}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex space-x-2">
        <button className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Edit
        </button>
        <button className="flex-1 px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
          View
        </button>
      </div>
    </div>
  )
}
