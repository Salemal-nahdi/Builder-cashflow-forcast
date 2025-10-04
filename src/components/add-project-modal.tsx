'use client'

import { useState } from 'react'
import { addMonths, format } from 'date-fns'

interface Milestone {
  id: string
  name: string
  month: number
  incomeAmount: number
  status: 'completed' | 'in-progress' | 'pending'
  usesSimpleCost: boolean
  costAmount: number
  costPaymentOffset: number
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

interface AddProjectModalProps {
  onClose: () => void
  onAdd: (project: DemoProject) => void
}

const projectTemplates = {
  residential: {
    name: 'Residential',
    milestones: [
      { name: 'Site Preparation & Foundation', percentage: 0.20, paymentOffset: -14 },
      { name: 'Framing & Roofing', percentage: 0.25, paymentOffset: -7 },
      { name: 'Rough-in (Plumbing, Electrical)', percentage: 0.20, paymentOffset: 0 },
      { name: 'Interior Finishes', percentage: 0.25, paymentOffset: 7 },
      { name: 'Final Completion & Handover', percentage: 0.10, paymentOffset: 14 },
    ]
  },
  commercial: {
    name: 'Commercial',
    milestones: [
      { name: 'Site Work & Preparation', percentage: 0.10, paymentOffset: -30 },
      { name: 'Foundation & Structure', percentage: 0.35, paymentOffset: -14 },
      { name: 'Mechanical & Electrical Systems', percentage: 0.25, paymentOffset: 0 },
      { name: 'Interior Build-out', percentage: 0.20, paymentOffset: 14 },
      { name: 'Final Inspection & Commissioning', percentage: 0.10, paymentOffset: 30 },
    ]
  },
  renovation: {
    name: 'Renovation',
    milestones: [
      { name: 'Demolition & Removal', percentage: 0.15, paymentOffset: 0 },
      { name: 'Structural Changes', percentage: 0.30, paymentOffset: 7 },
      { name: 'New Systems Installation', percentage: 0.25, paymentOffset: 14 },
      { name: 'Finishes & Restoration', percentage: 0.30, paymentOffset: 21 },
    ]
  }
}

export function AddProjectModal({ onClose, onAdd }: AddProjectModalProps) {
  const [projectName, setProjectName] = useState('')
  const [contractValue, setContractValue] = useState(500000)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [duration, setDuration] = useState(6)
  const [projectType, setProjectType] = useState<'residential' | 'commercial' | 'renovation'>('residential')
  const [generateMilestones, setGenerateMilestones] = useState(true)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const projectId = `proj-${Date.now()}`
    const start = new Date(startDate)
    const completion = addMonths(start, duration)

    let milestones: Milestone[] = []

    if (generateMilestones) {
      const template = projectTemplates[projectType]
      milestones = template.milestones.map((m, index) => ({
        id: `${projectId}-${index + 1}`,
        name: m.name,
        month: Math.floor((index / template.milestones.length) * duration),
        incomeAmount: Math.round(contractValue * m.percentage),
        status: 'pending' as const,
        usesSimpleCost: true,
        costAmount: Math.round(contractValue * m.percentage * 0.75), // 75% cost ratio
        costPaymentOffset: m.paymentOffset,
      }))
    } else {
      // Create one default milestone
      milestones = [{
        id: `${projectId}-1`,
        name: 'Project Completion',
        month: duration - 1,
        incomeAmount: contractValue,
        status: 'pending' as const,
        usesSimpleCost: true,
        costAmount: Math.round(contractValue * 0.75),
        costPaymentOffset: 0,
      }]
    }

    const newProject: DemoProject = {
      id: projectId,
      name: projectName || `New ${projectTemplates[projectType].name} Project`,
      status: 'planning',
      progress: 0,
      contractValue,
      expectedCompletion: completion,
      startDate: start,
      milestones,
    }

    onAdd(newProject)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add New Project</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-2">
              Project Name
            </label>
            <input
              type="text"
              id="projectName"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="e.g., Downtown Office Renovation"
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Project Type */}
          <div>
            <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-2">
              Project Type
            </label>
            <select
              id="projectType"
              value={projectType}
              onChange={(e) => setProjectType(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="residential">Residential Construction</option>
              <option value="commercial">Commercial Construction</option>
              <option value="renovation">Renovation/Remodel</option>
            </select>
          </div>

          {/* Contract Value & Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contractValue" className="block text-sm font-medium text-gray-700 mb-2">
                Contract Value
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  id="contractValue"
                  value={contractValue}
                  onChange={(e) => setContractValue(Number(e.target.value))}
                  min="0"
                  step="10000"
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                Duration (months)
              </label>
              <input
                type="number"
                id="duration"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                min="1"
                max="24"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Generate Milestones */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={generateMilestones}
                onChange={(e) => setGenerateMilestones(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <div className="font-medium text-gray-900">Auto-generate Milestones</div>
                <div className="text-sm text-gray-600 mt-1">
                  Create {projectTemplates[projectType].milestones.length} typical milestones for {projectTemplates[projectType].name.toLowerCase()} projects with realistic payment schedules
                </div>
              </div>
            </label>
          </div>

          {/* Preview */}
          {generateMilestones && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-3">Milestone Preview:</div>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {projectTemplates[projectType].milestones.map((m, index) => (
                  <div key={index} className="flex justify-between text-sm bg-white p-2 rounded">
                    <span className="text-gray-700">{m.name}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-green-600 font-medium">
                        ${Math.round(contractValue * m.percentage).toLocaleString()}
                      </span>
                      <span className="text-xs text-gray-500">
                        {m.paymentOffset === 0 ? 'Same day' : 
                         m.paymentOffset > 0 ? `+${m.paymentOffset}d` : 
                         `${m.paymentOffset}d`}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              Add Project
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
