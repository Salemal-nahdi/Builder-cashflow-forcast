'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Milestone {
  id: string
  name: string
  percentage: number
  date: string
  costs: Cost[]
}

interface Cost {
  id: string
  description: string
  amount: number
  paymentDaysOffset: number // days after milestone payment (negative = before)
}

interface SimpleAddProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

export function SimpleAddProjectModal({ isOpen, onClose }: SimpleAddProjectModalProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [projectName, setProjectName] = useState('')
  const [contractValue, setContractValue] = useState('')
  const [startDate, setStartDate] = useState('')
  const [milestones, setMilestones] = useState<Milestone[]>([
    {
      id: '1',
      name: 'Deposit',
      percentage: 10,
      date: '',
      costs: []
    }
  ])

  if (!isOpen) return null

  const addMilestone = () => {
    const newId = (milestones.length + 1).toString()
    setMilestones([
      ...milestones,
      {
        id: newId,
        name: '',
        percentage: 0,
        date: '',
        costs: []
      }
    ])
  }

  const updateMilestone = (id: string, field: keyof Milestone, value: any) => {
    setMilestones(milestones.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ))
  }

  const removeMilestone = (id: string) => {
    setMilestones(milestones.filter(m => m.id !== id))
  }

  const addCost = (milestoneId: string) => {
    setMilestones(milestones.map(m => {
      if (m.id === milestoneId) {
        return {
          ...m,
          costs: [
            ...m.costs,
            {
              id: Date.now().toString(),
              description: '',
              amount: 0,
              paymentDaysOffset: 7
            }
          ]
        }
      }
      return m
    }))
  }

  const updateCost = (milestoneId: string, costId: string, field: keyof Cost, value: any) => {
    setMilestones(milestones.map(m => {
      if (m.id === milestoneId) {
        return {
          ...m,
          costs: m.costs.map(c => 
            c.id === costId ? { ...c, [field]: value } : c
          )
        }
      }
      return m
    }))
  }

  const removeCost = (milestoneId: string, costId: string) => {
    setMilestones(milestones.map(m => {
      if (m.id === milestoneId) {
        return {
          ...m,
          costs: m.costs.filter(c => c.id !== costId)
        }
      }
      return m
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/projects/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          contractValue: parseFloat(contractValue),
          startDate,
          milestones: milestones.map(m => ({
            name: m.name,
            percentage: m.percentage,
            date: m.date,
            costs: m.costs
          }))
        })
      })

      if (response.ok) {
        router.refresh()
        onClose()
        // Reset form
        setProjectName('')
        setContractValue('')
        setStartDate('')
        setMilestones([{
          id: '1',
          name: 'Deposit',
          percentage: 10,
          date: '',
          costs: []
        }])
      } else {
        const error = await response.json()
        alert(`Error: ${error.error || 'Failed to create project'}`)
      }
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project')
    } finally {
      setIsSubmitting(false)
    }
  }

  const totalPercentage = milestones.reduce((sum, m) => sum + (m.percentage || 0), 0)

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add New Project</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Basic Info */}
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Project Name *
              </label>
              <input
                type="text"
                required
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Smith Family Home"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contract Value *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    required
                    value={contractValue}
                    onChange={(e) => setContractValue(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    placeholder="450000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  required
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Milestones */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Progress Claims / Milestones
              </h3>
              <span className={`text-sm font-medium ${totalPercentage === 100 ? 'text-green-600' : 'text-orange-600'}`}>
                Total: {totalPercentage}%
              </span>
            </div>

            <div className="space-y-4">
              {milestones.map((milestone, index) => (
                <div key={milestone.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Milestone {index + 1}</span>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(milestone.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <input
                      type="text"
                      required
                      value={milestone.name}
                      onChange={(e) => updateMilestone(milestone.id, 'name', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Name (e.g., Foundation)"
                    />
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min="0"
                        max="100"
                        value={milestone.percentage}
                        onChange={(e) => updateMilestone(milestone.id, 'percentage', parseFloat(e.target.value) || 0)}
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Percentage"
                      />
                      <span className="absolute right-3 top-2 text-gray-500">%</span>
                    </div>
                    <input
                      type="date"
                      required
                      value={milestone.date}
                      onChange={(e) => updateMilestone(milestone.id, 'date', e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Costs for this milestone */}
                  {milestone.costs.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <div className="text-xs font-medium text-gray-600 mb-2">Associated Costs:</div>
                      {milestone.costs.map((cost) => (
                        <div key={cost.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-gray-200">
                          <input
                            type="text"
                            value={cost.description}
                            onChange={(e) => updateCost(milestone.id, cost.id, 'description', e.target.value)}
                            className="col-span-5 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Description (e.g., Concrete)"
                          />
                          <div className="col-span-3 relative">
                            <span className="absolute left-2 top-1 text-sm text-gray-500">$</span>
                            <input
                              type="number"
                              value={cost.amount}
                              onChange={(e) => updateCost(milestone.id, cost.id, 'amount', parseFloat(e.target.value) || 0)}
                              className="w-full pl-6 pr-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Amount"
                            />
                          </div>
                          <div className="col-span-3 relative">
                            <input
                              type="number"
                              value={cost.paymentDaysOffset}
                              onChange={(e) => updateCost(milestone.id, cost.id, 'paymentDaysOffset', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Days"
                            />
                            <span className="absolute -bottom-4 left-0 text-xs text-gray-500">days after payment</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeCost(milestone.id, cost.id)}
                            className="col-span-1 text-red-600 hover:text-red-800"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => addCost(milestone.id)}
                    className="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    + Add cost for this milestone
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addMilestone}
              className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + Add another milestone
            </button>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || totalPercentage !== 100}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

