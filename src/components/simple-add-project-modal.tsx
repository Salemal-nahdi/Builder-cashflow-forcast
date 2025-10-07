'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { addDays, format } from 'date-fns'

interface Cost {
  description: string
  amount: number
  date: string // Actual date of cost
}

interface Milestone {
  name: string
  percentage: number
  amount: number
  date: string
  costs: Cost[]
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
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [milestones, setMilestones] = useState<Milestone[]>([
    { name: 'Deposit', percentage: 10, amount: 0, date: format(new Date(), 'yyyy-MM-dd'), costs: [{ description: '', amount: 0, date: format(new Date(), 'yyyy-MM-dd') }] },
    { name: 'Foundation', percentage: 20, amount: 0, date: format(addDays(new Date(), 30), 'yyyy-MM-dd'), costs: [{ description: '', amount: 0, date: format(addDays(new Date(), 30), 'yyyy-MM-dd') }] },
    { name: 'Framing', percentage: 30, amount: 0, date: format(addDays(new Date(), 60), 'yyyy-MM-dd'), costs: [{ description: '', amount: 0, date: format(addDays(new Date(), 60), 'yyyy-MM-dd') }] },
    { name: 'Final Payment', percentage: 40, amount: 0, date: format(addDays(new Date(), 90), 'yyyy-MM-dd'), costs: [{ description: '', amount: 0, date: format(addDays(new Date(), 90), 'yyyy-MM-dd') }] }
  ])

  // Auto-calculate amounts when contract value or percentages change
  const updateMilestoneAmounts = (value: string, milestones: Milestone[]) => {
    if (!value) return milestones
    const total = parseFloat(value)
    return milestones.map(m => ({
      ...m,
      amount: (total * m.percentage) / 100
    }))
  }

  if (!isOpen) return null

  const updateMilestone = (index: number, field: keyof Milestone, value: any) => {
    const updated = [...milestones]
    updated[index] = { ...updated[index], [field]: value }
    
    // If percentage changed and we have a contract value, recalculate amount
    if (field === 'percentage' && contractValue) {
      const total = parseFloat(contractValue)
      updated[index].amount = (total * parseFloat(value)) / 100
    }
    
    // If amount changed and we have a contract value, recalculate percentage
    if (field === 'amount' && contractValue) {
      const total = parseFloat(contractValue)
      updated[index].percentage = (parseFloat(value) / total) * 100
    }
    
    setMilestones(updated)
  }

  const handleContractValueChange = (value: string) => {
    setContractValue(value)
    if (value) {
      setMilestones(updateMilestoneAmounts(value, milestones))
    }
  }

  const addMilestone = () => {
    setMilestones([...milestones, { 
      name: '', 
      percentage: 0, 
      amount: 0, 
      date: format(new Date(), 'yyyy-MM-dd'),
      costs: [{ description: '', amount: 0, date: format(new Date(), 'yyyy-MM-dd') }] // Start with one cost
    }])
  }

  const removeMilestone = (index: number) => {
    setMilestones(milestones.filter((_, i) => i !== index))
  }

  const addCost = (milestoneIndex: number) => {
    const updated = [...milestones]
    // Default new cost to same date as milestone
    const milestoneDate = updated[milestoneIndex].date
    updated[milestoneIndex].costs.push({ description: '', amount: 0, date: milestoneDate })
    setMilestones(updated)
  }

  const updateCost = (milestoneIndex: number, costIndex: number, field: keyof Cost, value: any) => {
    const updated = [...milestones]
    updated[milestoneIndex].costs[costIndex] = {
      ...updated[milestoneIndex].costs[costIndex],
      [field]: value
    }
    setMilestones(updated)
  }

  const removeCost = (milestoneIndex: number, costIndex: number) => {
    const updated = [...milestones]
    updated[milestoneIndex].costs = updated[milestoneIndex].costs.filter((_, i) => i !== costIndex)
    setMilestones(updated)
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
            amount: m.amount,
            date: m.date,
            costs: m.costs
          }))
        })
      })

      if (response.ok) {
        router.refresh()
        onClose()
        // Reset
        setProjectName('')
        setContractValue('')
        setStartDate(format(new Date(), 'yyyy-MM-dd'))
        setMilestones([
          { name: 'Deposit', percentage: 10, amount: 0, date: format(new Date(), 'yyyy-MM-dd'), costs: [{ description: '', amount: 0, date: format(new Date(), 'yyyy-MM-dd') }] },
          { name: 'Foundation', percentage: 20, amount: 0, date: format(addDays(new Date(), 30), 'yyyy-MM-dd'), costs: [{ description: '', amount: 0, date: format(addDays(new Date(), 30), 'yyyy-MM-dd') }] },
          { name: 'Framing', percentage: 30, amount: 0, date: format(addDays(new Date(), 60), 'yyyy-MM-dd'), costs: [{ description: '', amount: 0, date: format(addDays(new Date(), 60), 'yyyy-MM-dd') }] },
          { name: 'Final Payment', percentage: 40, amount: 0, date: format(addDays(new Date(), 90), 'yyyy-MM-dd'), costs: [{ description: '', amount: 0, date: format(addDays(new Date(), 90), 'yyyy-MM-dd') }] }
        ])
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
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
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
                    onChange={(e) => handleContractValueChange(e.target.value)}
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
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Progress Payments</h3>
                <p className="text-xs text-gray-500">Simple milestone-based payments</p>
              </div>
              <span className={`text-sm font-medium px-3 py-1 rounded-full ${
                totalPercentage === 100 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-orange-100 text-orange-700'
              }`}>
                {totalPercentage}%
              </span>
            </div>

            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        required
                        value={milestone.name}
                        onChange={(e) => updateMilestone(index, 'name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium"
                        placeholder="Payment name"
                      />
                    </div>
                    {milestones.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMilestone(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Percentage</label>
                      <div className="relative">
                        <input
                          type="number"
                          required
                          min="0"
                          max="100"
                          step="0.1"
                          value={milestone.percentage}
                          onChange={(e) => updateMilestone(index, 'percentage', parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md text-sm"
                        />
                        <span className="absolute right-3 top-2 text-sm text-gray-500">%</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Amount</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-sm text-gray-500">$</span>
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          value={milestone.amount}
                          onChange={(e) => updateMilestone(index, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Date</label>
                      <input
                        type="date"
                        required
                        value={milestone.date}
                        onChange={(e) => updateMilestone(index, 'date', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>

                  {/* Costs Section */}
                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <h4 className="text-xs font-medium text-gray-700 mb-2">Associated Costs</h4>
                    <div className="space-y-2">
                      {milestone.costs.map((cost, costIndex) => (
                          <div key={costIndex} className="grid grid-cols-12 gap-2 items-start">
                            <div className="col-span-4">
                              <input
                                type="text"
                                value={cost.description}
                                onChange={(e) => updateCost(index, costIndex, 'description', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                                placeholder="e.g., Materials, Labor"
                              />
                            </div>
                            <div className="col-span-3">
                              <div className="relative">
                                <span className="absolute left-2 top-1.5 text-xs text-gray-500">$</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={cost.amount}
                                  onChange={(e) => updateCost(index, costIndex, 'amount', parseFloat(e.target.value) || 0)}
                                  className="w-full pl-6 pr-2 py-1.5 border border-gray-300 rounded text-xs"
                                  placeholder="0"
                                />
                              </div>
                            </div>
                            <div className="col-span-4">
                              <input
                                type="date"
                                value={cost.date}
                                onChange={(e) => updateCost(index, costIndex, 'date', e.target.value)}
                                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs"
                              />
                            </div>
                            <div className="col-span-1 flex items-center">
                              <button
                                type="button"
                                onClick={() => removeCost(index, costIndex)}
                                className="text-red-600 hover:text-red-800 p-0.5"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => addCost(index)}
                      className="mt-2 w-full py-1.5 border border-dashed border-gray-300 rounded text-xs text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
                    >
                      + Add another cost
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addMilestone}
              className="mt-3 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors"
            >
              + Add milestone
            </button>
          </div>

          {/* Preview */}
          {contractValue && milestones.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Payment Schedule Summary</h4>
              <div className="space-y-1 text-sm">
                {milestones.map((m, i) => (
                  <div key={i} className="flex justify-between text-blue-700">
                    <span>{m.name} - {format(new Date(m.date), 'MMM d, yyyy')}</span>
                    <span className="font-medium">
                      ${m.amount.toLocaleString()} ({m.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
                <div className="pt-2 border-t border-blue-200 flex justify-between font-bold text-blue-900">
                  <span>Total</span>
                  <span>${milestones.reduce((sum, m) => sum + m.amount, 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
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
