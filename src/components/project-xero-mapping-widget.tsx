'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface TrackingOption {
  id: string
  name: string
  categoryId: string
}

interface TrackingCategory {
  id: string
  name: string
  options: TrackingOption[]
}

interface Contact {
  id: string
  name: string
  type: string
}

interface ProjectXeroMappingWidgetProps {
  projectId: string
  currentMappings: Array<{
    id: string
    trackingOption: {
      id: string
      name: string
      category: {
        name: string
      }
    }
  }>
  currentContact?: {
    contact: {
      id: string
      name: string
    }
  } | null
  trackingCategories: TrackingCategory[]
  contacts: Contact[]
}

export function ProjectXeroMappingWidget({
  projectId,
  currentMappings,
  currentContact,
  trackingCategories,
  contacts
}: ProjectXeroMappingWidgetProps) {
  const router = useRouter()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedTrackingOptions, setSelectedTrackingOptions] = useState<string[]>(
    currentMappings.map(m => m.trackingOption.id)
  )
  const [selectedContact, setSelectedContact] = useState(currentContact?.contact.id || '')

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/xero-mapping`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trackingOptionIds: selectedTrackingOptions,
          contactId: selectedContact || null
        })
      })

      if (response.ok) {
        router.refresh()
        setIsEditing(false)
      } else {
        alert('Failed to save mapping')
      }
    } catch (error) {
      console.error('Error saving mapping:', error)
      alert('Failed to save mapping')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemove = async () => {
    if (!confirm('Are you sure you want to remove Xero mappings for this project?')) return
    
    setIsSaving(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/xero-mapping`, {
        method: 'DELETE'
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to remove mapping')
      }
    } catch (error) {
      console.error('Error removing mapping:', error)
      alert('Failed to remove mapping')
    } finally {
      setIsSaving(false)
    }
  }

  const hasMappings = currentMappings.length > 0 || currentContact

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Xero Integration</h2>
        {hasMappings && !isEditing && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Linked
          </span>
        )}
      </div>

      {!isEditing ? (
        <div className="space-y-3">
          {currentMappings.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Tracking Categories:</p>
              <div className="flex flex-wrap gap-2">
                {currentMappings.map(mapping => (
                  <span key={mapping.id} className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-blue-50 text-blue-700 border border-blue-200">
                    {mapping.trackingOption.category.name}: {mapping.trackingOption.name}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">No tracking categories mapped</p>
          )}

          {currentContact && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">Primary Contact:</p>
              <span className="inline-flex items-center px-3 py-1 rounded-md text-sm bg-gray-50 text-gray-700 border border-gray-200">
                {currentContact.contact.name}
              </span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            >
              {hasMappings ? 'Edit Mapping' : 'Link to Xero'}
            </button>
            {hasMappings && (
              <button
                onClick={handleRemove}
                disabled={isSaving}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-red-300 bg-white text-red-700 hover:bg-red-50"
              >
                Remove Mapping
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Tracking Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tracking Categories
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {trackingCategories.map(category => (
                <div key={category.id} className="bg-gray-50 p-2 rounded">
                  <div className="text-sm font-medium text-gray-600 mb-1">{category.name}</div>
                  <div className="space-y-1">
                    {category.options.map(option => (
                      <label key={option.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={selectedTrackingOptions.includes(option.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTrackingOptions([...selectedTrackingOptions, option.id])
                            } else {
                              setSelectedTrackingOptions(
                                selectedTrackingOptions.filter(id => id !== option.id)
                              )
                            }
                          }}
                          className="mr-2 rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700">{option.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Contact (Optional)
            </label>
            <select
              value={selectedContact}
              onChange={(e) => setSelectedContact(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">None</option>
              {contacts.map(contact => (
                <option key={contact.id} value={contact.id}>
                  {contact.name} ({contact.type})
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false)
                setSelectedTrackingOptions(currentMappings.map(m => m.trackingOption.id))
                setSelectedContact(currentContact?.contact.id || '')
              }}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

