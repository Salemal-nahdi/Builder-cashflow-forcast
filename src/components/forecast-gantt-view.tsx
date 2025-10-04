'use client'

import { addMonths, format, differenceInDays } from 'date-fns'

interface Milestone {
  id: string
  name: string
  month: number
  incomeAmount: number
  status: 'completed' | 'in-progress' | 'pending'
  costPaymentOffset?: number
}

interface DemoProject {
  id: string
  name: string
  status: string
  startDate: Date
  expectedCompletion: Date
  milestones: Milestone[]
}

interface ForecastGanttViewProps {
  projects: DemoProject[]
}

export function ForecastGanttView({ projects }: ForecastGanttViewProps) {
  // Find the overall timeline range
  const allDates = projects.flatMap(p => [p.startDate, p.expectedCompletion])
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
  
  // Generate month labels for timeline
  const months: Date[] = []
  let currentMonth = new Date(minDate.getFullYear(), minDate.getMonth(), 1)
  const endMonth = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)
  
  while (currentMonth <= endMonth) {
    months.push(new Date(currentMonth))
    currentMonth = addMonths(currentMonth, 1)
  }

  const totalDays = differenceInDays(maxDate, minDate) || 1
  
  const getPositionPercent = (date: Date) => {
    const days = differenceInDays(date, minDate)
    return (days / totalDays) * 100
  }

  const getDurationPercent = (start: Date, end: Date) => {
    const days = differenceInDays(end, start)
    return (days / totalDays) * 100
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'in-progress': return 'bg-blue-500'
      case 'pending': return 'bg-gray-400'
      default: return 'bg-gray-300'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Project Timeline (Gantt View)</h3>
        <p className="text-sm text-gray-600 mt-1">
          Visual representation of project schedules and milestone timing
        </p>
      </div>

      <div className="p-6">
        {/* Timeline Header */}
        <div className="flex mb-4">
          <div className="w-64 flex-shrink-0"></div>
          <div className="flex-1 relative">
            <div className="flex border-b border-gray-300">
              {months.map((month, index) => (
                <div
                  key={index}
                  className="flex-1 text-center text-xs font-medium text-gray-600 pb-2"
                  style={{ minWidth: '80px' }}
                >
                  {format(month, 'MMM yyyy')}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projects */}
        <div className="space-y-6">
          {projects.map((project) => {
            const projectStart = project.startDate
            const projectEnd = project.expectedCompletion
            const projectLeft = getPositionPercent(projectStart)
            const projectWidth = getDurationPercent(projectStart, projectEnd)

            return (
              <div key={project.id} className="relative">
                {/* Project Header */}
                <div className="flex items-start mb-2">
                  <div className="w-64 flex-shrink-0 pr-4">
                    <h4 className="font-semibold text-gray-900 text-sm">{project.name}</h4>
                    <p className="text-xs text-gray-600">
                      {format(projectStart, 'MMM d')} - {format(projectEnd, 'MMM d, yyyy')}
                    </p>
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded ${
                      project.status === 'active' ? 'bg-green-100 text-green-800' :
                      project.status === 'planning' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {project.status}
                    </span>
                  </div>

                  {/* Timeline */}
                  <div className="flex-1 relative h-16">
                    {/* Project Bar */}
                    <div
                      className="absolute top-0 h-8 bg-blue-200 rounded-lg shadow-sm border border-blue-300"
                      style={{
                        left: `${projectLeft}%`,
                        width: `${projectWidth}%`,
                      }}
                    >
                      <div className="h-full flex items-center justify-center text-xs font-medium text-blue-900">
                        {Math.round(projectWidth * totalDays / 100)} days
                      </div>
                    </div>

                    {/* Milestones */}
                    {project.milestones.map((milestone) => {
                      const milestoneDate = addMonths(project.startDate, milestone.month)
                      const milestonePosition = getPositionPercent(milestoneDate)

                      return (
                        <div key={milestone.id}>
                          {/* Income Payment */}
                          <div
                            className="absolute top-10"
                            style={{ left: `${milestonePosition}%` }}
                          >
                            <div className="relative -translate-x-1/2">
                              <div className="flex flex-col items-center">
                                <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-md" title={`Income: ${milestone.name}`}></div>
                                <div className="text-[10px] text-green-700 font-medium mt-1 whitespace-nowrap">
                                  ${(milestone.incomeAmount / 1000).toFixed(0)}k
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Cost Payment (if different timing) */}
                          {milestone.costPaymentOffset !== 0 && milestone.costPaymentOffset !== undefined && (
                            <div
                              className="absolute top-10"
                              style={{
                                left: `${getPositionPercent(
                                  addMonths(new Date(milestoneDate.getTime() + (milestone.costPaymentOffset || 0) * 24 * 60 * 60 * 1000), 0)
                                )}%`
                              }}
                            >
                              <div className="relative -translate-x-1/2">
                                <div className="flex flex-col items-center">
                                  <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md" title={`Cost: ${milestone.name}`}></div>
                                  <div className="text-[10px] text-red-700 font-medium mt-1">
                                    {milestone.costPaymentOffset > 0 ? `+${milestone.costPaymentOffset}d` : `${milestone.costPaymentOffset}d`}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Milestone Details List */}
                <div className="ml-64 pl-4 mt-2">
                  <div className="text-xs text-gray-600 space-y-1">
                    {project.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-center space-x-2">
                        <span className={`w-2 h-2 rounded-full ${getStatusColor(milestone.status)}`}></span>
                        <span className="font-medium">{milestone.name}</span>
                        <span className="text-gray-400">|</span>
                        <span className="text-green-600">${milestone.incomeAmount.toLocaleString()}</span>
                        {milestone.costPaymentOffset !== 0 && (
                          <>
                            <span className="text-gray-400">|</span>
                            <span className="text-blue-600">
                              Payment: {milestone.costPaymentOffset === 0 ? 'Same day' :
                                       milestone.costPaymentOffset && milestone.costPaymentOffset > 0 ? `+${milestone.costPaymentOffset}d` :
                                       `${milestone.costPaymentOffset}d`}
                            </span>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Divider */}
                <div className="mt-4 border-b border-gray-200"></div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-8 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-200 border border-blue-300 rounded"></div>
              <span className="text-gray-700">Project Duration</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow"></div>
              <span className="text-gray-700">Income Payment</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow"></div>
              <span className="text-gray-700">Cost Payment</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-700">Completed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-gray-700">In Progress</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span className="text-gray-700">Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
