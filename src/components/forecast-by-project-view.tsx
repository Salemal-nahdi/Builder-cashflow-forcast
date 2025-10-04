'use client'

import { addMonths, addDays, format } from 'date-fns'

interface CostItem {
  id: string
  description: string
  amount: number
  vendor?: string
  paymentOffset: number
  status: 'pending' | 'paid'
}

interface Milestone {
  id: string
  name: string
  month: number
  incomeAmount: number
  status: 'completed' | 'in-progress' | 'pending'
  usesSimpleCost?: boolean
  costAmount?: number
  costPaymentOffset?: number
  costItems?: CostItem[]
}

interface DemoProject {
  id: string
  name: string
  status: string
  progress: number
  contractValue: number
  expectedCompletion: Date
  startDate: Date
  milestones: Milestone[]
}

interface ForecastByProjectViewProps {
  projects: DemoProject[]
  viewMode: 'monthly' | 'weekly'
  overheadCosts: { monthly: number[] }
  startingBalance: number
}

export function ForecastByProjectView({ 
  projects, 
  viewMode, 
  overheadCosts,
  startingBalance 
}: ForecastByProjectViewProps) {
  const baseDate = new Date('2024-01-01')
  const [expandedProjects, setExpandedProjects] = React.useState<Set<string>>(new Set())
  const [expandedCosts, setExpandedCosts] = React.useState<Set<string>>(new Set())

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }

  const toggleCosts = (projectId: string) => {
    setExpandedCosts(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
      }
      return next
    })
  }
  
  // Generate periods
  const periods: Array<{ label: string; start: Date; end: Date }> = []
  
  if (viewMode === 'weekly') {
    for (let week = 0; week < 26; week++) {
      const weekStart = addDays(baseDate, week * 7)
      const weekEnd = addDays(weekStart, 7)
      periods.push({
        label: `Week ${week + 1}`,
        start: weekStart,
        end: weekEnd
      })
    }
  } else {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
    monthNames.forEach((month, index) => {
      const monthStart = addMonths(baseDate, index)
      const monthEnd = addMonths(baseDate, index + 1)
      periods.push({
        label: month,
        start: monthStart,
        end: monthEnd
      })
    })
  }

  // Calculate data for each project per period with detailed breakdowns
  const projectData = projects.map(project => {
    const periodData = periods.map(period => {
      let income = 0
      let costs = 0
      const incomeDetails: Array<{ milestone: string; amount: number }> = []
      const costDetails: Array<{ description: string; amount: number; offset?: number }> = []

      project.milestones.forEach(milestone => {
        const incomeDate = addMonths(baseDate, milestone.month)
        
        // Check if income falls in this period
        if (incomeDate >= period.start && incomeDate < period.end) {
          income += milestone.incomeAmount
          incomeDetails.push({
            milestone: milestone.name,
            amount: milestone.incomeAmount
          })
        }

        // Calculate costs with details
        if (milestone.usesSimpleCost) {
          const costDate = addDays(incomeDate, milestone.costPaymentOffset || 0)
          if (costDate >= period.start && costDate < period.end) {
            const amount = milestone.costAmount || 0
            costs += amount
            costDetails.push({
              description: `${milestone.name} (Costs)`,
              amount,
              offset: milestone.costPaymentOffset
            })
          }
        } else if (milestone.costItems) {
          // Detailed cost model
          milestone.costItems.forEach(item => {
            const itemCostDate = addDays(incomeDate, item.paymentOffset)
            if (itemCostDate >= period.start && itemCostDate < period.end) {
              costs += item.amount
              costDetails.push({
                description: `${milestone.name}: ${item.description}`,
                amount: item.amount,
                offset: item.paymentOffset
              })
            }
          })
        }
      })

      return { 
        income, 
        costs, 
        net: income - costs,
        incomeDetails,
        costDetails
      }
    })

    return {
      project,
      periodData,
      totalIncome: periodData.reduce((sum, p) => sum + p.income, 0),
      totalCosts: periodData.reduce((sum, p) => sum + p.costs, 0),
    }
  })

  // Calculate overheads per period
  const periodOverheads = periods.map((period, index) => {
    if (viewMode === 'weekly') {
      const monthIndex = Math.floor(index / 4.33)
      return monthIndex < overheadCosts.monthly.length 
        ? overheadCosts.monthly[monthIndex] / 4.33 
        : 0
    } else {
      return overheadCosts.monthly[index] || 0
    }
  })

  // Calculate totals per period
  const periodTotals = periods.map((period, index) => {
    const totalIncome = projectData.reduce((sum, p) => sum + p.periodData[index].income, 0)
    const totalCosts = projectData.reduce((sum, p) => sum + p.periodData[index].costs, 0)
    const overhead = periodOverheads[index]
    const net = totalIncome - totalCosts - overhead
    return { totalIncome, totalCosts, overhead, net }
  })

  // Calculate running balance
  let runningBalance = startingBalance
  const balances = periodTotals.map(period => {
    runningBalance += period.net
    return runningBalance
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'planning': return 'bg-blue-100 text-blue-800'
      case 'completed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
        <h3 className="text-lg font-semibold text-gray-900">Cashflow by Project</h3>
        <p className="text-sm text-gray-600 mt-1">
          See income and costs broken down by individual project • {viewMode === 'weekly' ? '26 weeks' : '6 months'}
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Project
              </th>
              {periods.map((period, index) => (
                <th key={index} className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {period.label}
                </th>
              ))}
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-blue-50">
                Total
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Each Project */}
            {projectData.map(({ project, periodData, totalIncome, totalCosts }, projectIndex) => {
              const isExpanded = expandedProjects.has(project.id)
              
              return (
              <React.Fragment key={project.id}>
                {/* Project Income Row */}
                <tr className={projectIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-inherit z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleProject(project.id)}
                          className="mr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                          title={isExpanded ? 'Collapse details' : 'Expand details'}
                        >
                          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'transform rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          <div className="text-xs text-green-600">Income</div>
                        </div>
                      </div>
                    </div>
                  </td>
                  {periodData.map((data, index) => (
                    <td key={index} className="px-4 py-4 whitespace-nowrap text-center text-sm relative group">
                      {data.income > 0 ? (
                        <>
                          <span className="font-medium text-green-600 cursor-help">
                            ${(data.income / 1000).toFixed(0)}k
                          </span>
                          {/* Hover Tooltip */}
                          {data.incomeDetails.length > 0 && (
                            <div className="invisible group-hover:visible absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                              <div className="font-semibold mb-1">Income Breakdown:</div>
                              {data.incomeDetails.map((detail, idx) => (
                                <div key={idx} className="flex justify-between space-x-4">
                                  <span>{detail.milestone}:</span>
                                  <span className="font-medium">${detail.amount.toLocaleString()}</span>
                                </div>
                              ))}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-700 bg-green-50">
                    ${totalIncome.toLocaleString()}
                  </td>
                </tr>

                {/* Project Costs Row */}
                <tr className={projectIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-inherit z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <button
                          onClick={() => toggleCosts(project.id)}
                          className="mr-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                          title={expandedCosts.has(project.id) ? 'Collapse cost details' : 'Expand cost details'}
                        >
                          <svg className={`w-4 h-4 transition-transform ${expandedCosts.has(project.id) ? 'transform rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                        <div className="flex-shrink-0">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{project.name}</div>
                          <div className="text-xs text-red-600">Costs</div>
                        </div>
                      </div>
                    </div>
                  </td>
                  {periodData.map((data, index) => (
                    <td key={index} className="px-4 py-4 whitespace-nowrap text-center text-sm relative group">
                      {data.costs > 0 ? (
                        <>
                          <span className="font-medium text-red-600 cursor-help">
                            -${(data.costs / 1000).toFixed(0)}k
                          </span>
                          {/* Hover Tooltip */}
                          {data.costDetails.length > 0 && (
                            <div className="invisible group-hover:visible absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap max-w-xs">
                              <div className="font-semibold mb-1">Cost Breakdown:</div>
                              {data.costDetails.map((detail, idx) => (
                                <div key={idx} className="flex justify-between space-x-4 text-left">
                                  <span className="truncate">{detail.description}</span>
                                  <span className="font-medium flex-shrink-0">
                                    ${detail.amount.toLocaleString()}
                                    {detail.offset !== undefined && detail.offset !== 0 && (
                                      <span className="text-blue-300 ml-1">
                                        ({detail.offset > 0 ? '+' : ''}{detail.offset}d)
                                      </span>
                                    )}
                                  </span>
                                </div>
                              ))}
                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-700 bg-red-50">
                    -${totalCosts.toLocaleString()}
                  </td>
                </tr>

                {/* Expanded Cost Details */}
                {expandedCosts.has(project.id) && (
                  <tr className={`${projectIndex % 2 === 0 ? 'bg-red-50' : 'bg-red-100'} border-t border-red-200`}>
                    <td colSpan={periods.length + 2} className="px-6 py-4">
                      <div className="ml-10 space-y-3">
                        <div className="text-sm font-semibold text-gray-900 mb-3">Cost Breakdown: {project.name}</div>
                        
                        {/* Group costs by milestone */}
                        <div className="space-y-4">
                          {project.milestones.map((milestone) => {
                            // Calculate total cost for this milestone
                            const milestoneCost = milestone.usesSimpleCost
                              ? (milestone.costAmount || 0)
                              : (milestone.costItems?.reduce((sum, item) => sum + item.amount, 0) || 0)
                            
                            if (milestoneCost === 0) return null
                            
                            return (
                              <div key={milestone.id} className="bg-white rounded-lg p-3 shadow-sm">
                                <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-200">
                                  <div>
                                    <span className="text-sm font-semibold text-gray-900">{milestone.name}</span>
                                    <span className="ml-2 text-xs text-gray-500">
                                      (Income: ${milestone.incomeAmount.toLocaleString()})
                                    </span>
                                  </div>
                                  <span className="text-sm font-bold text-red-600">
                                    Total: ${milestoneCost.toLocaleString()}
                                  </span>
                                </div>
                                
                                {/* Cost items */}
                                <div className="space-y-1">
                                  {milestone.usesSimpleCost ? (
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-700">
                                        Combined Costs
                                        {milestone.costPaymentOffset !== undefined && milestone.costPaymentOffset !== 0 && (
                                          <span className="ml-2 text-blue-600 font-medium">
                                            (Paid {milestone.costPaymentOffset > 0 ? '+' : ''}{milestone.costPaymentOffset} days after income)
                                          </span>
                                        )}
                                      </span>
                                      <span className="font-medium text-gray-900">${(milestone.costAmount || 0).toLocaleString()}</span>
                                    </div>
                                  ) : (
                                    milestone.costItems?.map((item, idx) => (
                                      <div key={idx} className="flex justify-between text-xs">
                                        <span className="text-gray-700">
                                          {item.description}
                                          {item.paymentOffset !== undefined && item.paymentOffset !== 0 && (
                                            <span className="ml-2 text-blue-600 font-medium">
                                              ({item.paymentOffset > 0 ? '+' : ''}{item.paymentOffset}d)
                                            </span>
                                          )}
                                        </span>
                                        <span className="font-medium text-gray-900">${item.amount.toLocaleString()}</span>
                                      </div>
                                    ))
                                  )}
                                </div>
                                
                                {/* Margin for this milestone */}
                                <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-xs">
                                  <span className="text-gray-600 font-medium">Milestone Margin:</span>
                                  <span className={`font-bold ${
                                    milestone.incomeAmount - milestoneCost > 0 ? 'text-green-600' : 'text-red-600'
                                  }`}>
                                    ${(milestone.incomeAmount - milestoneCost).toLocaleString()}
                                    <span className="ml-1 text-gray-500">
                                      ({milestone.incomeAmount > 0 
                                        ? ((milestone.incomeAmount - milestoneCost) / milestone.incomeAmount * 100).toFixed(1) 
                                        : 0}%)
                                    </span>
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                        
                        {/* Total summary */}
                        <div className="mt-4 pt-3 border-t-2 border-red-300 bg-white rounded-lg p-3 shadow-sm">
                          <div className="grid grid-cols-3 gap-4 text-xs">
                            <div className="flex flex-col">
                              <span className="text-gray-600">Total Project Costs:</span>
                              <span className="text-lg font-bold text-red-600">${totalCosts.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-600">Total Project Income:</span>
                              <span className="text-lg font-bold text-green-600">${totalIncome.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-gray-600">Net Project Margin:</span>
                              <span className="text-lg font-bold text-blue-600">
                                ${(totalIncome - totalCosts).toLocaleString()}
                                <span className="ml-1 text-sm text-gray-500">
                                  ({totalIncome > 0 ? ((totalIncome - totalCosts) / totalIncome * 100).toFixed(1) : 0}%)
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <tr className={`${projectIndex % 2 === 0 ? 'bg-blue-50' : 'bg-blue-100'} border-t border-blue-200`}>
                    <td colSpan={periods.length + 2} className="px-6 py-4">
                      <div className="ml-10 space-y-2">
                        <div className="text-sm font-semibold text-gray-900 mb-3">Project Details: {project.name}</div>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <div className="font-medium text-gray-700 mb-1">Milestones ({project.milestones.length}):</div>
                            <ul className="space-y-1">
                              {project.milestones.map((milestone) => (
                                <li key={milestone.id} className="flex justify-between">
                                  <span className="text-gray-600">{milestone.name}</span>
                                  <span className={`font-medium ${
                                    milestone.status === 'completed' ? 'text-green-600' :
                                    milestone.status === 'in-progress' ? 'text-blue-600' :
                                    'text-gray-500'
                                  }`}>
                                    ${milestone.incomeAmount.toLocaleString()}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <div className="font-medium text-gray-700 mb-1">Summary:</div>
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Contract Value:</span>
                                <span className="font-medium">${project.contractValue.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Income:</span>
                                <span className="font-medium text-green-600">${totalIncome.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Costs:</span>
                                <span className="font-medium text-red-600">${totalCosts.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between border-t border-gray-300 pt-1">
                                <span className="text-gray-900 font-semibold">Net Margin:</span>
                                <span className="font-bold text-blue-700">${(totalIncome - totalCosts).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Margin %:</span>
                                <span className="font-medium">
                                  {totalIncome > 0 ? ((totalIncome - totalCosts) / totalIncome * 100).toFixed(1) : 0}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}

                {/* Project Net Row */}
                <tr className={`${projectIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b-2 border-gray-300`}>
                  <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-inherit z-10">
                    <div className="flex items-center ml-6">
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(project.status)}`}>
                          {project.status}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-bold text-gray-900">{project.name}</div>
                        <div className="text-xs text-blue-600 font-medium">Net Margin</div>
                      </div>
                    </div>
                  </td>
                  {periodData.map((data, index) => (
                    <td key={index} className="px-4 py-4 whitespace-nowrap text-center text-sm">
                      {data.net !== 0 ? (
                        <span className={`font-bold ${data.net > 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                          {data.net > 0 ? '+' : ''}${(data.net / 1000).toFixed(0)}k
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-700 bg-blue-50">
                    ${(totalIncome - totalCosts).toLocaleString()}
                  </td>
                </tr>
              </React.Fragment>
            )})}

            {/* Overheads Row */}
            <tr className="bg-orange-50 border-t-2 border-gray-400">
              <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-orange-50 z-10">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                  </div>
                  <div className="ml-3">
                    <div className="text-sm font-bold text-gray-900">Overheads</div>
                    <div className="text-xs text-orange-600">Fixed Costs</div>
                  </div>
                </div>
              </td>
              {periodOverheads.map((overhead, index) => (
                <td key={index} className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium text-orange-600 relative group">
                  <span className="cursor-help">-${(overhead / 1000).toFixed(0)}k</span>
                  {/* Hover Tooltip */}
                  <div className="invisible group-hover:visible absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                    <div className="font-semibold mb-1">Fixed Costs:</div>
                    <div className="flex justify-between space-x-4">
                      <span>Monthly Overheads:</span>
                      <span className="font-medium">${overhead.toLocaleString()}</span>
                    </div>
                    <div className="text-gray-300 text-xs mt-1">
                      {viewMode === 'weekly' ? 'Prorated from monthly' : 'Total for month'}
                    </div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-orange-700 bg-orange-100">
                -${periodOverheads.reduce((sum, o) => sum + o, 0).toLocaleString()}
              </td>
            </tr>

            {/* Total Net Cashflow */}
            <tr className="bg-purple-50 border-t-2 border-gray-400">
              <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-purple-50 z-10">
                <div className="text-sm font-bold text-gray-900">PERIOD NET CASHFLOW</div>
              </td>
              {periodTotals.map((total, index) => (
                <td key={index} className="px-4 py-4 whitespace-nowrap text-center text-sm">
                  <span className={`font-bold ${total.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {total.net >= 0 ? '+' : ''}${(total.net / 1000).toFixed(0)}k
                  </span>
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-700 bg-purple-100">
                ${periodTotals.reduce((sum, p) => sum + p.net, 0).toLocaleString()}
              </td>
            </tr>

            {/* Running Balance */}
            <tr className="bg-blue-100 border-t-2 border-gray-500">
              <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-blue-100 z-10">
                <div className="text-sm font-bold text-gray-900">CASH BALANCE</div>
                <div className="text-xs text-gray-600">Starting: ${startingBalance.toLocaleString()}</div>
              </td>
              {balances.map((balance, index) => (
                <td key={index} className="px-4 py-4 whitespace-nowrap text-center text-sm">
                  <span className={`font-bold ${balance >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                    ${(balance / 1000).toFixed(0)}k
                  </span>
                </td>
              ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-700 bg-blue-200">
                ${balances[balances.length - 1]?.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Project Income</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">Project Costs</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Net Margin</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span className="text-gray-700">Overheads</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-700">Period Net</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Add React import for Fragment
import React from 'react'
