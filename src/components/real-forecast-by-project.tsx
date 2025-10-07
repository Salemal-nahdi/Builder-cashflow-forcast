'use client'

import React, { useState } from 'react'
import { format, startOfMonth, endOfMonth } from 'date-fns'

interface RealForecastByProjectProps {
  forecastPeriods: any[]
  projects: any[]
}

export function RealForecastByProject({ 
  forecastPeriods,
  projects 
}: RealForecastByProjectProps) {
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())

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

  // Calculate project data for each period
  const projectData = projects.map(project => {
    const periodData = forecastPeriods.map(period => {
      let income = 0
      let costs = 0
      const incomeDetails: any[] = []
      const costDetails: any[] = []

      const periodStart = new Date(period.startDate)
      const periodEnd = new Date(period.endDate)

      // Calculate income from milestones
      project.milestones?.forEach((milestone: any) => {
        const milestoneDate = new Date(milestone.expectedDate)
        if (milestoneDate >= periodStart && milestoneDate < periodEnd) {
          const amount = Number(milestone.amount || 0)
          income += amount
          incomeDetails.push({
            name: milestone.name,
            amount
          })
        }
      })

      // Calculate costs from supplier claims
      project.supplierClaims?.forEach((claim: any) => {
        const claimDate = new Date(claim.expectedDate)
        if (claimDate >= periodStart && claimDate < periodEnd) {
          const amount = Number(claim.amount || 0)
          costs += amount
          costDetails.push({
            name: claim.supplierName || claim.description,
            amount
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

    const totalIncome = periodData.reduce((sum, p) => sum + p.income, 0)
    const totalCosts = periodData.reduce((sum, p) => sum + p.costs, 0)

    return {
      project,
      periodData,
      totalIncome,
      totalCosts,
      netMargin: totalIncome - totalCosts
    }
  })

  // Calculate period totals
  const periodTotals = forecastPeriods.map((_, periodIndex) => {
    const income = projectData.reduce((sum, p) => sum + p.periodData[periodIndex].income, 0)
    const costs = projectData.reduce((sum, p) => sum + p.periodData[periodIndex].costs, 0)
    return { income, costs, net: income - costs }
  })

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-20">
              Project
            </th>
            {forecastPeriods.map((period, index) => (
              <th key={index} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {format(new Date(period.startDate), 'MMM yyyy')}
              </th>
            ))}
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-100">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {projectData.map(({ project, periodData, totalIncome, totalCosts, netMargin }) => (
            <React.Fragment key={project.id}>
              {/* Income Row */}
              <tr className="hover:bg-green-50">
                <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white">
                  <div className="flex items-center">
                    <button
                      onClick={() => toggleProject(project.id)}
                      className="mr-2 text-gray-400 hover:text-gray-600"
                    >
                      <svg className={`w-4 h-4 transform transition-transform ${expandedProjects.has(project.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{project.name}</div>
                      <div className="text-xs text-green-600">Income</div>
                    </div>
                  </div>
                </td>
                {periodData.map((data, idx) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-center">
                    {data.income > 0 ? (
                      <div className="relative group">
                        <span className="text-sm font-medium text-green-600">
                          ${(data.income / 1000).toFixed(0)}k
                        </span>
                        {data.incomeDetails.length > 0 && (
                          <div className="invisible group-hover:visible absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                            {data.incomeDetails.map((detail: any, i: number) => (
                              <div key={i} className="flex justify-between gap-4">
                                <span>{detail.name}:</span>
                                <span className="font-medium">${detail.amount.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-700 bg-green-50">
                  ${totalIncome.toLocaleString()}
                </td>
              </tr>

              {/* Costs Row */}
              <tr className="hover:bg-red-50">
                <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-white">
                  <div className="ml-6">
                    <div className="text-sm font-medium text-gray-900">{project.name}</div>
                    <div className="text-xs text-red-600">Costs</div>
                  </div>
                </td>
                {periodData.map((data, idx) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-center">
                    {data.costs > 0 ? (
                      <div className="relative group">
                        <span className="text-sm font-medium text-red-600">
                          -${(data.costs / 1000).toFixed(0)}k
                        </span>
                        {data.costDetails.length > 0 && (
                          <div className="invisible group-hover:visible absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap">
                            {data.costDetails.map((detail: any, i: number) => (
                              <div key={i} className="flex justify-between gap-4">
                                <span>{detail.name}:</span>
                                <span className="font-medium">${detail.amount.toLocaleString()}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-300">—</span>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-red-700 bg-red-50">
                  -${totalCosts.toLocaleString()}
                </td>
              </tr>

              {/* Net Row */}
              <tr className="bg-blue-50 border-b-2 border-gray-300">
                <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-blue-50">
                  <div className="ml-6">
                    <div className="text-sm font-semibold text-gray-900">{project.name}</div>
                    <div className="text-xs text-blue-700 font-medium">Net Margin</div>
                  </div>
                </td>
                {periodData.map((data, idx) => (
                  <td key={idx} className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`text-sm font-bold ${data.net >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      ${(data.net / 1000).toFixed(0)}k
                    </span>
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-blue-700 bg-blue-100">
                  ${netMargin.toLocaleString()}
                </td>
              </tr>

              {/* Expanded Details */}
              {expandedProjects.has(project.id) && (
                <tr>
                  <td colSpan={forecastPeriods.length + 2} className="px-6 py-4 bg-gray-50">
                    <div className="text-sm space-y-2">
                      <div className="font-medium text-gray-900">Project Details:</div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-gray-600">Contract Value:</span>
                          <span className="ml-2 font-medium">${Number(project.contractValue || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <span className="ml-2 font-medium capitalize">{project.status}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Margin %:</span>
                          <span className="ml-2 font-medium">
                            {totalIncome > 0 ? ((netMargin / totalIncome) * 100).toFixed(1) : 0}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}

          {/* Period Totals */}
          <tr className="bg-purple-100 font-bold">
            <td className="px-6 py-4 whitespace-nowrap sticky left-0 bg-purple-100">
              <div className="text-sm font-bold text-gray-900">PERIOD NET TOTAL</div>
            </td>
            {periodTotals.map((total, idx) => (
              <td key={idx} className="px-6 py-4 whitespace-nowrap text-center">
                <span className={`text-sm font-bold ${total.net >= 0 ? 'text-purple-700' : 'text-red-700'}`}>
                  ${(total.net / 1000).toFixed(0)}k
                </span>
              </td>
            ))}
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-purple-700">
              ${periodTotals.reduce((sum, p) => sum + p.net, 0).toLocaleString()}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-4 px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Income</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">Costs</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Net Margin</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
            <span className="text-gray-700">Period Total</span>
          </div>
        </div>
      </div>
    </div>
  )
}

