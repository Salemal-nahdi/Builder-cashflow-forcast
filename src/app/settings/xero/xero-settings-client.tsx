'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface TrackingOption {
  id: string
  name: string
  categoryId: string
}

interface TrackingCategory {
  id: string
  name: string
  status: string
  options: TrackingOption[]
}

interface XeroTrackingMap {
  id: string
  trackingOption: {
    name: string
  }
}

interface XeroContactMap {
  contact: {
    name: string
  }
}

interface Project {
  id: string
  name: string
  xeroTrackingMaps: XeroTrackingMap[]
  xeroContactMap?: XeroContactMap | null
}

interface XeroSettingsClientProps {
  xeroConnection: any
  projects: Project[]
  trackingCategories: TrackingCategory[]
  contacts: any[]
  unmappedEvents: any[]
}

export function XeroSettingsClient({
  xeroConnection,
  projects,
  trackingCategories,
  contacts,
  unmappedEvents,
}: XeroSettingsClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isConnecting, setIsConnecting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState<any>(null)
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [selectedTrackingOptions, setSelectedTrackingOptions] = useState<string[]>([])
  const [selectedContact, setSelectedContact] = useState<string>('')
  const [basis, setBasis] = useState<'cash' | 'accrual'>('accrual')

  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      // Show success message and refresh page
      router.push('/settings/xero')
    } else if (error) {
      // Show error message
      console.error('Xero connection error:', error)
    }
  }, [searchParams, router])

  const handleConnect = async () => {
    setIsConnecting(true)
    try {
      const response = await fetch('/api/xero/connect')
      const data = await response.json()
      
      if (data.authUrl) {
        window.location.href = data.authUrl
      } else {
        throw new Error('Failed to get authorization URL')
      }
    } catch (error) {
      console.error('Error connecting to Xero:', error)
      setIsConnecting(false)
    }
  }

  const handleSync = async () => {
    if (!xeroConnection) return

    setIsSyncing(true)
    try {
      const response = await fetch('/api/xero/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          connectionId: xeroConnection.id,
          entityTypes: ['accounts', 'tracking', 'contacts', 'invoices', 'bills', 'payments', 'bankTransactions'],
          initialSync: false,
          basis,
        }),
      })

      const data = await response.json()
      
      if (data.success) {
        setSyncStatus(data.stats)
        // Refresh the page to show updated data
        router.refresh()
      } else {
        throw new Error(data.error || 'Sync failed')
      }
    } catch (error) {
      console.error('Error syncing with Xero:', error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSaveMapping = async (projectId: string) => {
    try {
      // Save tracking option mappings
      if (selectedTrackingOptions.length > 0) {
        await fetch('/api/xero/mapping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            trackingOptionIds: selectedTrackingOptions,
          }),
        })
      }

      // Save contact mapping
      if (selectedContact) {
        await fetch('/api/xero/mapping', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId,
            contactId: selectedContact,
          }),
        })
      }

      // Clear selections
      setSelectedTrackingOptions([])
      setSelectedContact('')
      setSelectedProject('')
      
      // Refresh the page
      router.refresh()
    } catch (error) {
      console.error('Error saving mapping:', error)
    }
  }

  if (!xeroConnection) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No Xero connection</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect your Xero account to start syncing financial data automatically.
          </p>
          <div className="mt-6">
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isConnecting ? 'Connecting...' : 'Connect to Xero'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-medium text-gray-900">Connection Status</h2>
            <p className="text-sm text-gray-600">
              Connected to {xeroConnection.xeroOrgName}
            </p>
            {xeroConnection.lastSyncAt && (
              <p className="text-xs text-gray-500 mt-1">
                Last sync: {new Date(xeroConnection.lastSyncAt).toLocaleString()}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-gray-600">Connected</span>
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
        </div>

        {syncStatus && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Sync Results</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Actual Events:</span>
                <span className="ml-2 font-medium">{syncStatus.actualEventsCount}</span>
              </div>
              <div>
                <span className="text-gray-600">Basis:</span>
                <span className="ml-2 font-medium capitalize">{basis}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Basis Selection */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Accounting Basis</h2>
        <div className="flex space-x-4">
          <label className="flex items-center">
            <input
              type="radio"
              value="accrual"
              checked={basis === 'accrual'}
              onChange={(e) => setBasis(e.target.value as 'accrual')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Accrual Basis</span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="cash"
              checked={basis === 'cash'}
              onChange={(e) => setBasis(e.target.value as 'cash')}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Cash Basis</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Choose how to recognize income and expenses. Accrual basis records when invoices/bills are created, 
          cash basis records when payments are received/made.
        </p>
      </div>

      {/* Project Mapping */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Project Mapping</h2>
        <p className="text-sm text-gray-600 mb-4">
          Map your projects to Xero tracking categories and contacts for accurate cashflow tracking.
        </p>

        <div className="space-y-4">
          {projects.map((project) => {
            const hasMappings = project.xeroTrackingMaps.length > 0 || project.xeroContactMap
            const mappedCategories = project.xeroTrackingMaps.map(m => m.trackingOption.name).join(', ')
            
            return (
              <div key={project.id} className={`border rounded-lg p-4 ${hasMappings ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{project.name}</h3>
                      {hasMappings && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Mapped
                        </span>
                      )}
                    </div>
                    {hasMappings && mappedCategories && (
                      <p className="text-xs text-gray-600 mt-1">
                        Tracking: {mappedCategories}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedProject(selectedProject === project.id ? '' : project.id)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                  >
                    {selectedProject === project.id ? 'Close' : 'Edit Mapping'}
                  </button>
                </div>

                {selectedProject === project.id && (
                <div className="space-y-4">
                  {/* Tracking Options */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tracking Categories
                    </label>
                    <div className="space-y-2">
                      {trackingCategories.map((category) => (
                        <div key={category.id}>
                          <div className="text-sm font-medium text-gray-600 mb-1">
                            {category.name}
                          </div>
                          <div className="space-y-1">
                            {category.options.map((option) => (
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
                                  className="mr-2"
                                />
                                <span className="text-sm text-gray-700">{option.name}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Contact Mapping */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Contact
                    </label>
                    <select
                      value={selectedContact}
                      onChange={(e) => setSelectedContact(e.target.value)}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      <option value="">Select a contact</option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name} ({contact.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleSaveMapping(project.id)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Save Mapping
                    </button>
                    <button
                      onClick={() => {
                        setSelectedProject('')
                        setSelectedTrackingOptions([])
                        setSelectedContact('')
                      }}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Unmapped Events */}
      {unmappedEvents.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Unmapped Transactions</h2>
          <p className="text-sm text-gray-600 mb-4">
            These transactions couldn&apos;t be automatically mapped to projects. 
            Review and map them manually or update your tracking categories in Xero.
          </p>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {unmappedEvents.slice(0, 10).map((event) => (
                  <tr key={event.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(event.occurredAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        event.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {event.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${Number(event.amount).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {event.description || 'No description'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.sourceType} - {event.reference}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {unmappedEvents.length > 10 && (
            <p className="text-sm text-gray-500 mt-4">
              Showing 10 of {unmappedEvents.length} unmapped transactions
            </p>
          )}
        </div>
      )}
    </div>
  )
}
