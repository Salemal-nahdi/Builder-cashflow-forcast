'use client'

import { useState } from 'react'
import { format } from 'date-fns'

interface Project {
  id: string
  name: string
  milestones: Array<{
    id: string
    name: string
    expectedDate: Date
    amount: number | null
  }>
  supplierClaims: Array<{
    id: string
    supplierName: string
    expectedDate: Date
    amount: number
  }>
  materialOrders: Array<{
    id: string
    supplierName: string
    expectedDate: Date
    amount: number
  }>
}

interface Scenario {
  id: string
  name: string
  isBase: boolean
}

interface ScenarioEditorProps {
  scenario: Scenario
  projects: Project[]
}

export function ScenarioEditor({ scenario, projects }: ScenarioEditorProps) {
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedEntity, setSelectedEntity] = useState<string>('')
  const [selectedEntityType, setSelectedEntityType] = useState<string>('')
  const [daysShift, setDaysShift] = useState<number>(0)
  const [amountShift, setAmountShift] = useState<number>(0)
  const [isAdding, setIsAdding] = useState(false)

  const handleAddAdjustment = async () => {
    if (!selectedEntity || !selectedEntityType) return

    setIsAdding(true)
    try {
      const response = await fetch(`/api/scenarios/${scenario.id}/shifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          entityType: selectedEntityType,
          entityId: selectedEntity,
          daysShift,
          amountShift: amountShift || null,
        }),
      })

      if (response.ok) {
        // Reset form
        setSelectedEntity('')
        setSelectedEntityType('')
        setDaysShift(0)
        setAmountShift(0)
        // Refresh the page to show new adjustment
        window.location.reload()
      } else {
        throw new Error('Failed to add adjustment')
      }
    } catch (error) {
      console.error('Error adding adjustment:', error)
      alert('Failed to add adjustment. Please try again.')
    } finally {
      setIsAdding(false)
    }
  }

  const getEntityOptions = () => {
    if (!selectedProject) return []
    
    const project = projects.find(p => p.id === selectedProject)
    if (!project) return []

    const options = []
    
    if (selectedEntityType === 'milestone') {
      options.push(...project.milestones.map(m => ({
        id: m.id,
        name: m.name,
        date: m.expectedDate,
        amount: m.amount,
      })))
    } else if (selectedEntityType === 'supplier_claim') {
      options.push(...project.supplierClaims.map(c => ({
        id: c.id,
        name: c.supplierName,
        date: c.expectedDate,
        amount: c.amount,
      })))
    } else if (selectedEntityType === 'material_order') {
      options.push(...project.materialOrders.map(o => ({
        id: o.id,
        name: o.supplierName,
        date: o.expectedDate,
        amount: o.amount,
      })))
    }

    return options
  }

  if (scenario.isBase) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Base Scenario</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Base Forecast
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  This is the base scenario representing your current project timelines and assumptions. 
                  You cannot modify the base scenario directly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Adjustment</h2>
      
      <div className="space-y-4">
        {/* Project Selection */}
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
            Project
          </label>
          <select
            id="project"
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value)
              setSelectedEntity('')
              setSelectedEntityType('')
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Entity Type Selection */}
        {selectedProject && (
          <div>
            <label htmlFor="entityType" className="block text-sm font-medium text-gray-700 mb-1">
              Item Type
            </label>
            <select
              id="entityType"
              value={selectedEntityType}
              onChange={(e) => {
                setSelectedEntityType(e.target.value)
                setSelectedEntity('')
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select item type</option>
              <option value="milestone">Milestone</option>
              <option value="supplier_claim">Supplier Claim</option>
              <option value="material_order">Material Order</option>
            </select>
          </div>
        )}

        {/* Entity Selection */}
        {selectedEntityType && (
          <div>
            <label htmlFor="entity" className="block text-sm font-medium text-gray-700 mb-1">
              {selectedEntityType === 'milestone' ? 'Milestone' : 
               selectedEntityType === 'supplier_claim' ? 'Supplier Claim' : 
               'Material Order'}
            </label>
            <select
              id="entity"
              value={selectedEntity}
              onChange={(e) => setSelectedEntity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an item</option>
              {getEntityOptions().map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} - {format(new Date(option.date), 'MMM dd, yyyy')} - ${option.amount?.toLocaleString() || 'TBD'}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Adjustments */}
        {selectedEntity && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="daysShift" className="block text-sm font-medium text-gray-700 mb-1">
                Date Shift (days)
              </label>
              <input
                type="number"
                id="daysShift"
                value={daysShift}
                onChange={(e) => setDaysShift(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Positive = delay, negative = accelerate
              </p>
            </div>

            <div>
              <label htmlFor="amountShift" className="block text-sm font-medium text-gray-700 mb-1">
                Amount Adjustment ($)
              </label>
              <input
                type="number"
                id="amountShift"
                value={amountShift}
                onChange={(e) => setAmountShift(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Positive = increase, negative = decrease
              </p>
            </div>
          </div>
        )}

        {/* Add Button */}
        {selectedEntity && (
          <button
            onClick={handleAddAdjustment}
            disabled={isAdding}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? 'Adding...' : 'Add Adjustment'}
          </button>
        )}
      </div>
    </div>
  )
}
