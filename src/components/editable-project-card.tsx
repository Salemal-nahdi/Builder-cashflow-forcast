'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface EditableProject {
  id: string
  name: string
  status: string
  progress: number
  contractValue: number
  expectedCompletion: Date
  monthlyIncome: number[] // 6 months of income distribution
}

interface EditableProjectCardProps {
  project: EditableProject
  onUpdate: (updates: Partial<EditableProject>) => void
}

export function EditableProjectCard({ project, onUpdate }: EditableProjectCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editData, setEditData] = useState({
    contractValue: project.contractValue,
    expectedCompletion: format(project.expectedCompletion, 'yyyy-MM-dd'),
    monthlyIncome: [...project.monthlyIncome],
  })

  const handleSave = () => {
    onUpdate({
      contractValue: editData.contractValue,
      expectedCompletion: new Date(editData.expectedCompletion),
      monthlyIncome: editData.monthlyIncome,
    })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setEditData({
      contractValue: project.contractValue,
      expectedCompletion: format(project.expectedCompletion, 'yyyy-MM-dd'),
      monthlyIncome: [...project.monthlyIncome],
    })
    setIsEditing(false)
  }

  const updateMonthlyIncome = (monthIndex: number, value: number) => {
    const newMonthlyIncome = [...editData.monthlyIncome]
    newMonthlyIncome[monthIndex] = value
    setEditData(prev => ({ ...prev, monthlyIncome: newMonthlyIncome }))
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

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 50) return 'bg-blue-500'
    if (progress >= 25) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const totalProjectedIncome = project.monthlyIncome.reduce((sum, income) => sum + income, 0)

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-lg border-2 border-blue-300">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">EDITING</span>
          </div>

          <div className="space-y-4">
            {/* Contract Value */}
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

            {/* Expected Completion */}
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

            {/* Monthly Income Distribution */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monthly Income Distribution (Jan-Jun 2024)
              </label>
              <div className="grid grid-cols-2 gap-2">
                {monthNames.map((month, index) => (
                  <div key={month}>
                    <label className="block text-xs text-gray-600 mb-1">{month}</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1 text-xs text-gray-500">$</span>
                      <input
                        type="number"
                        value={editData.monthlyIncome[index]}
                        onChange={(e) => updateMonthlyIncome(index, Number(e.target.value))}
                        className="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Total: ${editData.monthlyIncome.reduce((sum, income) => sum + income, 0).toLocaleString()}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <button
                onClick={handleSave}
                className="flex-1 px-3 py-2 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="flex-1 px-3 py-2 text-sm bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
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

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Contract Value</span>
            <span className="text-sm font-medium text-gray-900">
              ${project.contractValue.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Expected Completion</span>
            <span className="text-sm text-gray-900">
              {format(project.expectedCompletion, 'MMM dd, yyyy')}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Projected Income (6mo)</span>
            <span className="text-sm font-medium text-green-600">
              ${totalProjectedIncome.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsEditing(true)}
              className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Project
            </button>
            <button className="flex-1 px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors">
              View Details
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
