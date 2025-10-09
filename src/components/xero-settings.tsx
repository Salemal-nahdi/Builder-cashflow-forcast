'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { format } from 'date-fns'

interface Props {
  connection: any
  projects: any[]
  trackingCategories: any[]
}

export function XeroSettings({ connection: initialConnection, projects, trackingCategories }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [connection, setConnection] = useState(initialConnection)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<any>(null)

  // Handle OAuth callback messages
  useEffect(() => {
    const success = searchParams.get('success')
    const error = searchParams.get('error')

    if (success) {
      alert('Successfully connected to Xero!')
      router.replace('/settings/xero')
      router.refresh()
    } else if (error) {
      const message = searchParams.get('message')
      alert(`Xero connection error: ${error}${message ? ` - ${message}` : ''}`)
      router.replace('/settings/xero')
    }
  }, [searchParams, router])

  const handleConnect = () => {
    window.location.href = '/api/xero/connect'
  }

  const handleSync = async () => {
    setIsSyncing(true)
    setSyncResult(null)

    try {
      const response = await fetch('/api/xero/sync', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        setSyncResult(result)
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Sync failed: ${error.error}`)
      }
    } catch (error: any) {
      alert(`Sync failed: ${error.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleMapProject = async (projectId: string, trackingOptionId: string) => {
    try {
      const response = await fetch('/api/xero/mapping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, trackingOptionId })
      })

      if (response.ok) {
        router.refresh()
      } else {
        alert('Failed to create mapping')
      }
    } catch (error) {
      alert('Failed to create mapping')
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Xero Settings</h1>

      {/* Connection Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Connection Status</h2>
        {connection ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded">
              <div>
                <p className="font-medium text-green-800">Connected to Xero</p>
                {connection.lastSyncAt && (
                  <p className="text-sm text-gray-600">
                    Last synced: {format(new Date(connection.lastSyncAt), 'MMM dd, yyyy h:mm a')}
                  </p>
                )}
              </div>
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            {syncResult && (
              <div className="p-4 bg-blue-50 rounded">
                <p className="font-medium text-blue-800">Sync Complete</p>
                <p className="text-sm text-gray-600">
                  {syncResult.invoicesSynced} invoices and {syncResult.billsSynced} bills synced
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Not connected to Xero</p>
            <button
              onClick={handleConnect}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
            >
              Connect to Xero
            </button>
          </div>
        )}
      </div>

      {/* Project Mappings */}
      {connection && trackingCategories.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Project Mappings</h2>
          <p className="text-gray-600 mb-4">
            Link projects to Xero tracking categories to sync invoices and bills
          </p>

          <div className="space-y-4">
            {projects.map(project => (
              <div key={project.id} className="border rounded-lg p-4">
                <h3 className="font-semibold mb-2">{project.name}</h3>
                
                {project.xeroMaps.length > 0 ? (
                  <div className="space-y-2 mb-3">
                    {project.xeroMaps.map((map: any) => (
                      <div key={map.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-sm">
                          {map.trackingOption.category.name}: {map.trackingOption.name}
                        </span>
                        <button
                          onClick={async () => {
                            await fetch(`/api/xero/mapping?projectId=${project.id}&trackingOptionId=${map.trackingOptionId}`, {
                              method: 'DELETE'
                            })
                            router.refresh()
                          }}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mb-3">Not mapped</p>
                )}

                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleMapProject(project.id, e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  defaultValue=""
                >
                  <option value="">Add tracking category...</option>
                  {trackingCategories.map(category => (
                    <optgroup key={category.id} label={category.name}>
                      {category.options.map((option: any) => (
                        <option key={option.id} value={option.id}>
                          {option.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-2">How it works</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
          <li>Connect to Xero using the button above</li>
          <li>Map your projects to Xero tracking categories</li>
          <li>Click &quot;Sync Now&quot; to pull invoices and bills from Xero</li>
          <li>Invoices become milestones (income)</li>
          <li>Bills become costs (expenses)</li>
          <li>View the updated forecast on the main page</li>
        </ol>
      </div>
    </div>
  )
}

