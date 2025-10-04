'use client'

import { format, isAfter, isBefore, addDays } from 'date-fns'

interface Project {
  id: string
  name: string
  startDate: Date | null
  endDate: Date | null
  milestones: Array<{
    id: string
    name: string
    expectedDate: Date
    actualDate: Date | null
    status: string
    amount: number | null
  }>
  supplierClaims: Array<{
    id: string
    supplierName: string
    expectedDate: Date
    actualDate: Date | null
    status: string
    amount: number
  }>
  materialOrders: Array<{
    id: string
    supplierName: string
    expectedDate: Date
    actualDate: Date | null
    status: string
    amount: number
  }>
}

interface ProjectTimelineProps {
  project: Project
}

interface TimelineEvent {
  id: string
  type: 'milestone' | 'supplier_claim' | 'material_order'
  name: string
  date: Date
  amount: number
  status: string
  isOverdue: boolean
}

export function ProjectTimeline({ project }: ProjectTimelineProps) {
  // Combine all events into a single timeline
  const events: TimelineEvent[] = [
    ...project.milestones.map(m => ({
      id: m.id,
      type: 'milestone' as const,
      name: m.name,
      date: m.actualDate || m.expectedDate,
      amount: m.amount || 0,
      status: m.status,
      isOverdue: m.status === 'pending' && m.expectedDate < new Date(),
    })),
    ...project.supplierClaims.map(c => ({
      id: c.id,
      type: 'supplier_claim' as const,
      name: c.supplierName,
      date: c.actualDate || c.expectedDate,
      amount: c.amount,
      status: c.status,
      isOverdue: c.status === 'pending' && c.expectedDate < new Date(),
    })),
    ...project.materialOrders.map(o => ({
      id: o.id,
      type: 'material_order' as const,
      name: o.supplierName,
      date: o.actualDate || o.expectedDate,
      amount: o.amount,
      status: o.status,
      isOverdue: o.status === 'pending' && o.expectedDate < new Date(),
    })),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  const getEventIcon = (type: string, status: string) => {
    if (type === 'milestone') {
      switch (status) {
        case 'paid':
          return (
            <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )
        case 'invoiced':
          return <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        case 'overdue':
          return <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        default:
          return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
      }
    } else if (type === 'supplier_claim') {
      switch (status) {
        case 'paid':
          return (
            <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )
        case 'invoiced':
          return <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        case 'overdue':
          return <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        default:
          return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
      }
    } else {
      switch (status) {
        case 'received':
          return (
            <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )
        case 'ordered':
          return <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        case 'overdue':
          return <div className="w-3 h-3 bg-red-500 rounded-full"></div>
        default:
          return <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
      }
    }
  }

  const getEventTypeLabel = (type: string) => {
    switch (type) {
      case 'milestone':
        return 'Milestone'
      case 'supplier_claim':
        return 'Supplier Claim'
      case 'material_order':
        return 'Material Order'
      default:
        return 'Event'
    }
  }

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'milestone':
        return 'text-green-600 bg-green-100'
      case 'supplier_claim':
        return 'text-red-600 bg-red-100'
      case 'material_order':
        return 'text-blue-600 bg-blue-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  // Calculate timeline bounds
  const startDate = project.startDate || (events.length > 0 ? events[0].date : new Date())
  const endDate = project.endDate || (events.length > 0 ? events[events.length - 1].date : addDays(new Date(), 30))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Project Timeline</h2>
      
      {events.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">No timeline events yet. Add milestones, claims, or orders to see the timeline.</p>
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
          
          <div className="space-y-6">
            {events.map((event, index) => (
              <div key={event.id} className="relative flex items-start">
                {/* Timeline dot */}
                <div className="relative z-10 flex items-center justify-center w-8 h-8 bg-white rounded-full border-2 border-gray-300">
                  {getEventIcon(event.type, event.status)}
                </div>
                
                {/* Event content */}
                <div className="ml-6 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEventTypeColor(event.type)}`}>
                        {getEventTypeLabel(event.type)}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        event.isOverdue ? 'bg-red-100 text-red-800' :
                        event.status === 'paid' || event.status === 'received' ? 'bg-green-100 text-green-800' :
                        event.status === 'invoiced' || event.status === 'ordered' ? 'bg-blue-100 text-blue-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${event.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {format(event.date, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <h3 className="mt-1 text-sm font-medium text-gray-900">
                    {event.name}
                  </h3>
                  
                  {event.isOverdue && (
                    <p className="mt-1 text-sm text-red-600">
                      Overdue by {Math.ceil((new Date().getTime() - event.date.getTime()) / (1000 * 60 * 60 * 24))} days
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
