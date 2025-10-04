'use client'

import { useState } from 'react'
import { format } from 'date-fns'

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

interface MilestoneProject {
  id: string
  name: string
  status: string
  progress: number
  contractValue: number
  expectedCompletion: Date
  startDate?: Date
  milestones: Milestone[]
}

interface MilestoneProjectCardProps {
  project: MilestoneProject
  onUpdate: (updates: Partial<MilestoneProject>) => void
}

export function MilestoneProjectCard({ project, onUpdate }: MilestoneProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [expandedView, setExpandedView] = useState(false)
  const [editData, setEditData] = useState({
    contractValue: project.contractValue,
    expectedCompletion: format(project.expectedCompletion, 'yyyy-MM-dd'),
    milestones: project.milestones.map(m => ({ ...m })),
  })

  const handleSave = () => {
    onUpdate({
      contractValue: editData.contractValue,
      expectedCompletion: new Date(editData.expectedCompletion),
      milestones: editData.milestones,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData({
      contractValue: project.contractValue,
      expectedCompletion: format(project.expectedCompletion, 'yyyy-MM-dd'),
      milestones: project.milestones.map(m => ({ ...m })),
    })
    setIsEditing(false)
  }

  const updateMilestone = (milestoneId: string, updates: Partial<Milestone>) => {
    setEditData(prev => ({
      ...prev,
      milestones: prev.milestones.map(m => 
        m.id === milestoneId ? { ...m, ...updates } : m
      )
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'planning':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getMilestoneStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in-progress':
        return 'bg-blue-100 text-blue-800'
      case 'pending':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const totalProjectedIncome = project.milestones.reduce((sum, milestone) => sum + milestone.incomeAmount, 0)
  const totalProjectedCosts = project.milestones.reduce((sum, milestone) => {
    if (milestone.usesSimpleCost) {
      return sum + (milestone.costAmount || 0)
    } else if (milestone.costItems) {
      return sum + milestone.costItems.reduce((itemSum, item) => itemSum + item.amount, 0)
    }
    return sum
  }, 0)
  const totalMargin = totalProjectedIncome - totalProjectedCosts
  const marginPercent = totalProjectedIncome > 0 ? (totalMargin / totalProjectedIncome) * 100 : 0

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-lg border-2 border-blue-300 col-span-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full">EDITING PROGRESS PAYMENTS</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Project Details */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Project Details</h4>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Value
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    value={editData.contractValue}
                    onChange={(e) => setEditData(prev => ({ ...prev, contractValue: Number(e.target.value) }))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Completion
                </label>
                <input
                  type="date"
                  value={editData.expectedCompletion}
                  onChange={(e) => setEditData(prev => ({ ...prev, expectedCompletion: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Income:</span>
                  <span className="font-medium text-green-600">
                    ${editData.milestones.reduce((sum, m) => sum + m.incomeAmount, 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Costs:</span>
                  <span className="font-medium text-red-600">
                    ${editData.milestones.reduce((sum, m) => sum + (m.costAmount || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-gray-900">Project Margin:</span>
                  <span className={`${editData.milestones.reduce((sum, m) => sum + (m.incomeAmount - (m.costAmount || 0)), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${editData.milestones.reduce((sum, m) => sum + (m.incomeAmount - (m.costAmount || 0)), 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Milestones Editor */}
            <div className="lg:col-span-2">
              <h4 className="font-medium text-gray-900 mb-4">Progress Payments & Costs</h4>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {editData.milestones.map((milestone, index) => (
                  <div key={milestone.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Milestone Name</label>
                        <input
                          type="text"
                          value={milestone.name}
                          onChange={(e) => updateMilestone(milestone.id, { name: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Month</label>
                        <select
                          value={milestone.month}
                          onChange={(e) => updateMilestone(milestone.id, { month: Number(e.target.value) })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          {monthNames.map((month, idx) => (
                            <option key={idx} value={idx}>{month}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Income Amount</label>
                        <div className="relative">
                          <span className="absolute left-1 top-1 text-xs text-gray-500">$</span>
                          <input
                            type="number"
                            value={milestone.incomeAmount}
                            onChange={(e) => updateMilestone(milestone.id, { incomeAmount: Number(e.target.value) })}
                            className="w-full pl-4 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Cost Amount</label>
                        <div className="relative">
                          <span className="absolute left-1 top-1 text-xs text-gray-500">$</span>
                          <input
                            type="number"
                            value={milestone.costAmount || 0}
                            onChange={(e) => updateMilestone(milestone.id, { costAmount: Number(e.target.value), usesSimpleCost: true })}
                            className="w-full pl-4 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs text-gray-600 mb-1">Payment Timing</label>
                        <select
                          value={milestone.costPaymentOffset || 0}
                          onChange={(e) => updateMilestone(milestone.id, { costPaymentOffset: Number(e.target.value), usesSimpleCost: true })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value={-30}>30 days before income</option>
                          <option value={-14}>14 days before income</option>
                          <option value={-7}>7 days before income</option>
                          <option value={0}>Same day as income</option>
                          <option value={7}>7 days after income</option>
                          <option value={14}>14 days after income</option>
                          <option value={30}>30 days after income</option>
                          <option value={60}>60 days after income</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="mt-3 flex justify-between items-center">
                      <span className={`text-xs px-2 py-1 rounded ${getMilestoneStatusColor(milestone.status)}`}>
                        {milestone.status}
                      </span>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-gray-600">
                          Margin: ${((milestone.incomeAmount - (milestone.costAmount || 0))).toLocaleString()} 
                          ({milestone.incomeAmount > 0 ? (((milestone.incomeAmount - (milestone.costAmount || 0)) / milestone.incomeAmount) * 100).toFixed(1) : 0}%)
                        </span>
                        <span className="text-xs text-blue-600 font-medium">
                          {milestone.costPaymentOffset === 0 ? 'Same day' :
                           milestone.costPaymentOffset && milestone.costPaymentOffset > 0 ? `+${milestone.costPaymentOffset}d` :
                           milestone.costPaymentOffset && milestone.costPaymentOffset < 0 ? `${milestone.costPaymentOffset}d` : 'Same day'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-6 py-2 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
            >
              Cancel Changes
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Save All Changes
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {project.name}
            </h3>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{project.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(project.progress)}`}
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Contract Value</span>
              <span className="font-medium text-gray-900">
                ${project.contractValue.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Project Margin</span>
              <span className={`font-medium ${marginPercent >= 15 ? 'text-green-600' : marginPercent >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                {marginPercent.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Income</span>
              <span className="font-medium text-green-600">
                ${totalProjectedIncome.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Costs</span>
              <span className="font-medium text-red-600">
                ${totalProjectedCosts.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Expected Completion</span>
            <span className="text-sm text-gray-900">
              {format(project.expectedCompletion, 'MMM dd, yyyy')}
            </span>
          </div>
        </div>

        {/* Milestones Preview */}
        {expandedView && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Progress Payments ({project.milestones.length})</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {project.milestones.map((milestone) => {
                const milestoneCost = milestone.usesSimpleCost 
                  ? (milestone.costAmount || 0)
                  : (milestone.costItems?.reduce((sum, item) => sum + item.amount, 0) || 0)
                const paymentOffset = milestone.costPaymentOffset || 0
                
                return (
                  <div key={milestone.id} className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${getMilestoneStatusColor(milestone.status)}`}>
                        {monthNames[milestone.month]}
                      </span>
                      <span className="text-gray-700">{milestone.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-green-600">${milestone.incomeAmount.toLocaleString()}</div>
                      <div className="text-red-600">-${milestoneCost.toLocaleString()}</div>
                      {paymentOffset !== 0 && (
                        <div className="text-blue-600 text-[10px]">
                          {paymentOffset > 0 ? `+${paymentOffset}d` : `${paymentOffset}d`}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Payments & Costs
            </button>
            <button 
              onClick={() => setExpandedView(!expandedView)}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              {expandedView ? 'Hide' : 'Show'} Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
