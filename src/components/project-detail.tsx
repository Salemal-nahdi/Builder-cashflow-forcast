'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useRouter } from 'next/navigation'

interface Props {
  project: any
  trackingCategories: any[]
}

export function ProjectDetail({ project: initialProject, trackingCategories }: Props) {
  const router = useRouter()
  const [project, setProject] = useState(initialProject)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Form state
  const [name, setName] = useState(project.name)
  const [contractValue, setContractValue] = useState(Number(project.contractValue))
  const [startDate, setStartDate] = useState(format(new Date(project.startDate), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(new Date(project.endDate), 'yyyy-MM-dd'))

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          contractValue,
          startDate,
          endDate
        })
      })

      if (response.ok) {
        const updated = await response.json()
        setProject(updated)
        setIsEditing(false)
      }
    } catch (error) {
      alert('Error saving project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.push('/projects')
      }
    } catch (error) {
      alert('Error deleting project')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Link href="/projects" className="text-blue-600 hover:text-blue-800">
          ← Back to Projects
        </Link>
        <div className="space-x-4">
          {!isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Edit Project
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>

      {/* Project Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Project Details</h2>
        {!isEditing ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Name</label>
              <p className="text-lg">{project.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Contract Value</label>
              <p className="text-lg font-bold text-blue-600">
                ${Number(project.contractValue).toLocaleString()}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Start Date</label>
              <p className="text-lg">{format(new Date(project.startDate), 'MMM dd, yyyy')}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">End Date</label>
              <p className="text-lg">{format(new Date(project.endDate), 'MMM dd, yyyy')}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contract Value</label>
              <input
                type="number"
                value={contractValue}
                onChange={(e) => setContractValue(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
        )}
      </div>

      {/* Xero Mapping */}
      {trackingCategories.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Xero Tracking</h2>
          {project.xeroMaps.length > 0 ? (
            <div className="space-y-2">
              {project.xeroMaps.map((map: any) => (
                <div key={map.id} className="flex items-center justify-between p-3 bg-green-50 rounded">
                  <span className="font-medium">
                    {map.trackingOption.category.name}: {map.trackingOption.name}
                  </span>
                  <button
                    onClick={async () => {
                      await fetch(`/api/xero/mapping?projectId=${project.id}&trackingOptionId=${map.trackingOptionId}`, {
                        method: 'DELETE'
                      })
                      router.refresh()
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 mb-4">No Xero tracking categories linked</p>
          )}
          <Link
            href="/settings/xero"
            className="inline-block mt-4 text-blue-600 hover:text-blue-800"
          >
            Manage Xero Mappings →
          </Link>
        </div>
      )}

      {/* Milestones */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Milestones (Income)</h2>
        {project.milestones.length === 0 ? (
          <p className="text-gray-500">No milestones yet</p>
        ) : (
          <div className="space-y-2">
            {project.milestones.map((milestone: any) => (
              <div key={milestone.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{milestone.name}</span>
                  <span className="text-sm text-gray-500 ml-2">
                    {format(new Date(milestone.expectedDate), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-green-600">
                    ${Number(milestone.amount).toLocaleString()}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {milestone.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Costs */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Costs (Expenses)</h2>
        {project.costs.length === 0 ? (
          <p className="text-gray-500">No costs yet</p>
        ) : (
          <div className="space-y-2">
            {project.costs.map((cost: any) => (
              <div key={cost.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <div>
                  <span className="font-medium">{cost.description}</span>
                  {cost.vendor && <span className="text-sm text-gray-500 ml-2">({cost.vendor})</span>}
                  <span className="text-sm text-gray-500 ml-2">
                    {format(new Date(cost.expectedDate), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="font-bold text-red-600">
                    ${Number(cost.amount).toLocaleString()}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                    {cost.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

