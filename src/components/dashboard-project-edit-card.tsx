'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { Decimal } from '@prisma/client/runtime/library'

interface Milestone {
  id: string
  name: string
  expectedDate: Date
  amount: Decimal | number
  status: string
}

interface SupplierClaim {
  id: string
  supplierName: string
  expectedDate: Date
  amount: Decimal | number
  status: string
}

interface Project {
  id: string
  name: string
  description: string | null
  contractValue: Decimal | number | null
  projectGroupId: string | null
  projectGroup?: {
    id: string
    name: string
  } | null
  milestones: Milestone[]
  supplierClaims: SupplierClaim[]
  xeroTrackingMaps?: Array<{
    id: string
    trackingOption: {
      id: string
      name: string
      category: {
        id: string
        name: string
      }
    }
  }>
  xeroContactMap?: {
    contact: {
      id: string
      name: string
    }
  } | null
}

interface DashboardProjectEditCardProps {
  project: any
  xeroConnection?: any
  projectGroups: any[]
}

export function DashboardProjectEditCard({ 
  project, 
  xeroConnection,
  projectGroups 
}: DashboardProjectEditCardProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  
  // Project basic info state
  const [projectName, setProjectName] = useState(project.name)
  const [projectDescription, setProjectDescription] = useState(project.description || '')
  const [projectContractValue, setProjectContractValue] = useState(Number(project.contractValue || 0))
  const [projectGroupId, setProjectGroupId] = useState(project.projectGroupId || '')
  
  // Xero mapping state
  const [selectedTrackingOptions, setSelectedTrackingOptions] = useState<string[]>(
    project.xeroTrackingMaps?.map((m: any) => m.trackingOption.id) || []
  )
  const [selectedContactId, setSelectedContactId] = useState(
    project.xeroContactMap?.contact.id || ''
  )

  // Milestone editing state
  const [editingMilestones, setEditingMilestones] = useState<{[key: string]: {date: string, amount: number}}>({})
  
  // Cost editing state
  const [editingCosts, setEditingCosts] = useState<{[key: string]: {date: string, amount: number}}>({})
  
  // Track which items are being edited
  const [editingMilestoneId, setEditingMilestoneId] = useState<string | null>(null)
  const [editingCostId, setEditingCostId] = useState<string | null>(null)
  const [savingItemId, setSavingItemId] = useState<string | null>(null)

  const totalIncome = project.milestones.reduce((sum: number, m: any) => sum + Number(m.amount), 0)
  const totalCosts = project.supplierClaims.reduce((sum: number, c: any) => sum + Number(c.amount), 0)
  const netValue = totalIncome - totalCosts

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Update basic project details
      const projectResponse = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: projectName,
          description: projectDescription,
          contractValue: projectContractValue,
          projectGroupId: projectGroupId || null,
        }),
      })

      if (!projectResponse.ok) throw new Error('Failed to update project')

      // Update Xero mappings if there's a connection
      if (xeroConnection) {
        const mappingResponse = await fetch(`/api/projects/${project.id}/xero-mapping`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            trackingOptionIds: selectedTrackingOptions,
            contactId: selectedContactId || null,
          }),
        })

        if (!mappingResponse.ok) throw new Error('Failed to update Xero mappings')
      }

      setIsEditing(false)
      router.refresh()
    } catch (error) {
      console.error('Error saving project:', error)
      alert('Failed to save project changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete project')

      router.refresh()
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project')
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleCancel = () => {
    setProjectName(project.name)
    setProjectDescription(project.description || '')
    setProjectContractValue(Number(project.contractValue || 0))
    setProjectGroupId(project.projectGroupId || '')
    setSelectedTrackingOptions(project.xeroTrackingMaps?.map((m: any) => m.trackingOption.id) || [])
    setSelectedContactId(project.xeroContactMap?.contact.id || '')
    setIsEditing(false)
  }

  const toggleTrackingOption = (optionId: string) => {
    setSelectedTrackingOptions(prev =>
      prev.includes(optionId)
        ? prev.filter(id => id !== optionId)
        : [...prev, optionId]
    )
  }

  const handleEditMilestone = (milestone: any) => {
    setEditingMilestoneId(milestone.id)
    setEditingMilestones({
      ...editingMilestones,
      [milestone.id]: {
        date: format(new Date(milestone.expectedDate), 'yyyy-MM-dd'),
        amount: Number(milestone.amount)
      }
    })
  }

  const handleEditCost = (cost: any) => {
    setEditingCostId(cost.id)
    setEditingCosts({
      ...editingCosts,
      [cost.id]: {
        date: format(new Date(cost.expectedDate), 'yyyy-MM-dd'),
        amount: Number(cost.amount)
      }
    })
  }

  const handleSaveMilestone = async (milestoneId: string) => {
    setSavingItemId(milestoneId)
    try {
      const data = editingMilestones[milestoneId]
      const response = await fetch(`/api/milestones/${milestoneId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedDate: new Date(data.date).toISOString(),
          amount: data.amount
        })
      })

      if (!response.ok) throw new Error('Failed to update milestone')

      setEditingMilestoneId(null)
      router.refresh()
    } catch (error) {
      console.error('Error updating milestone:', error)
      alert('Failed to update milestone')
    } finally {
      setSavingItemId(null)
    }
  }

  const handleSaveCost = async (costId: string) => {
    setSavingItemId(costId)
    try {
      const data = editingCosts[costId]
      const response = await fetch(`/api/supplier-claims/${costId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expectedDate: new Date(data.date).toISOString(),
          amount: data.amount
        })
      })

      if (!response.ok) throw new Error('Failed to update cost')

      setEditingCostId(null)
      router.refresh()
    } catch (error) {
      console.error('Error updating cost:', error)
      alert('Failed to update cost')
    } finally {
      setSavingItemId(null)
    }
  }

  const handleCancelMilestoneEdit = () => {
    setEditingMilestoneId(null)
  }

  const handleCancelCostEdit = () => {
    setEditingCostId(null)
  }

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
      {/* Card Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="text-lg font-semibold text-gray-900 w-full border border-gray-300 rounded px-2 py-1"
              />
            ) : (
              <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
            )}
            
            {project.projectGroup && !isEditing && (
              <p className="text-sm text-gray-500 mt-1">{project.projectGroup.name}</p>
            )}
            
            {isEditing && (
              <select
                value={projectGroupId}
                onChange={(e) => setProjectGroupId(e.target.value)}
                className="mt-2 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="">No Group</option>
                {projectGroups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            )}

            {/* Xero Linked Badge */}
            {project.xeroTrackingMaps && project.xeroTrackingMaps.length > 0 && !isEditing && (
              <div className="flex items-center gap-1 mt-2">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-blue-600 font-medium">Linked to Xero</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg 
                className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-500">Income</p>
            <p className="text-sm font-semibold text-green-600">
              ${totalIncome.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Costs</p>
            <p className="text-sm font-semibold text-red-600">
              ${totalCosts.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Net</p>
            <p className={`text-sm font-semibold ${netValue >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ${netValue.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-gray-200 px-6 py-4 space-y-4">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            {isEditing ? (
              <textarea
                value={projectDescription}
                onChange={(e) => setProjectDescription(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
                rows={2}
                placeholder="Project description..."
              />
            ) : (
              <p className="text-sm text-gray-600">{project.description || 'No description'}</p>
            )}
          </div>

          {/* Contract Value */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Value</label>
            {isEditing ? (
              <input
                type="number"
                value={projectContractValue}
                onChange={(e) => setProjectContractValue(Number(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            ) : (
              <p className="text-sm text-gray-900">${Number(project.contractValue || 0).toLocaleString()}</p>
            )}
          </div>

          {/* Milestones */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Milestones ({project.milestones.length})</h4>
            <div className="space-y-2">
              {project.milestones.map((milestone: any) => (
                <div key={milestone.id} className="bg-gray-50 p-2 rounded">
                  {editingMilestoneId === milestone.id ? (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">Date</label>
                          <input
                            type="date"
                            value={editingMilestones[milestone.id]?.date || ''}
                            onChange={(e) => setEditingMilestones({
                              ...editingMilestones,
                              [milestone.id]: { ...editingMilestones[milestone.id], date: e.target.value }
                            })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-600 mb-1">Amount</label>
                          <input
                            type="number"
                            value={editingMilestones[milestone.id]?.amount || 0}
                            onChange={(e) => setEditingMilestones({
                              ...editingMilestones,
                              [milestone.id]: { ...editingMilestones[milestone.id], amount: Number(e.target.value) }
                            })}
                            className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveMilestone(milestone.id)}
                          disabled={savingItemId === milestone.id}
                          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {savingItemId === milestone.id ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          onClick={handleCancelMilestoneEdit}
                          disabled={savingItemId === milestone.id}
                          className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <span className="text-xs text-gray-700">{milestone.name}</span>
                        <div className="text-xs text-gray-500">
                          {format(new Date(milestone.expectedDate), 'dd MMM yyyy')} - ${Number(milestone.amount).toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={() => handleEditMilestone(milestone)}
                        className="ml-2 text-xs text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Costs */}
          {project.supplierClaims.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Costs ({project.supplierClaims.length})</h4>
              <div className="space-y-2">
                {project.supplierClaims.map((claim: any) => (
                  <div key={claim.id} className="bg-gray-50 p-2 rounded">
                    {editingCostId === claim.id ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Date</label>
                            <input
                              type="date"
                              value={editingCosts[claim.id]?.date || ''}
                              onChange={(e) => setEditingCosts({
                                ...editingCosts,
                                [claim.id]: { ...editingCosts[claim.id], date: e.target.value }
                              })}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-600 mb-1">Amount</label>
                            <input
                              type="number"
                              value={editingCosts[claim.id]?.amount || 0}
                              onChange={(e) => setEditingCosts({
                                ...editingCosts,
                                [claim.id]: { ...editingCosts[claim.id], amount: Number(e.target.value) }
                              })}
                              className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveCost(claim.id)}
                            disabled={savingItemId === claim.id}
                            className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {savingItemId === claim.id ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelCostEdit}
                            disabled={savingItemId === claim.id}
                            className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <span className="text-xs text-gray-700">{claim.supplierName}</span>
                          <div className="text-xs text-gray-500">
                            {format(new Date(claim.expectedDate), 'dd MMM yyyy')} - ${Number(claim.amount).toLocaleString()}
                          </div>
                        </div>
                        <button
                          onClick={() => handleEditCost(claim)}
                          className="ml-2 text-xs text-blue-600 hover:text-blue-700"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Xero Mapping Section - Always visible when connection exists */}
          {xeroConnection && (
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Xero Integration</h4>
              
              {isEditing ? (
                <div className="space-y-4">
                  {/* Tracking Categories - Edit Mode */}
                  {xeroConnection.trackingCategories?.map((category: any) => (
                    <div key={category.id}>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        {category.name}
                      </label>
                      <div className="space-y-1">
                        {category.options?.map((option: any) => (
                          <label key={option.id} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedTrackingOptions.includes(option.id)}
                              onChange={() => toggleTrackingOption(option.id)}
                              className="h-4 w-4 text-blue-600 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-700">{option.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Primary Contact - Edit Mode */}
                  {xeroConnection.contacts && xeroConnection.contacts.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-600 mb-2">
                        Primary Contact
                      </label>
                      <select
                        value={selectedContactId}
                        onChange={(e) => setSelectedContactId(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                      >
                        <option value="">Select contact...</option>
                        {xeroConnection.contacts.map((contact: any) => (
                          <option key={contact.id} value={contact.id}>
                            {contact.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  {/* Tracking Categories - View Mode */}
                  {project.xeroTrackingMaps && project.xeroTrackingMaps.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {project.xeroTrackingMaps.map((map: any) => (
                          <span key={map.id} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {map.trackingOption.category.name}: {map.trackingOption.name}
                          </span>
                        ))}
                      </div>
                      {project.xeroContactMap && (
                        <p className="text-sm text-gray-600">
                          Contact: {project.xeroContactMap.contact.name}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">No Xero tracking categories linked</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-200">
            {isEditing ? (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Project
              </button>
            )}

            {showDeleteConfirm ? (
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3 py-1 text-red-600 text-sm hover:text-red-700"
              >
                Delete Project
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

