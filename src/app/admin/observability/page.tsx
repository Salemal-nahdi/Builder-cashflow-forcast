'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'

interface HealthData {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: Date
  services: Record<string, { status: 'up' | 'down'; latency?: number }>
  metrics: {
    errorRate: number
    avgResponseTime: number
    rateLimitHits: number
  }
}

interface LogEntry {
  timestamp: Date
  level: 'error' | 'warn' | 'info' | 'debug'
  message: string
  context?: Record<string, any>
  userId?: string
  organizationId?: string
}

interface MetricGroup {
  name: string
  values: Array<{ value: number; timestamp: Date; tags?: Record<string, string> }>
  stats: { count: number; sum: number; avg: number; min: number; max: number }
}

export default function ObservabilityPage() {
  const [health, setHealth] = useState<HealthData | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [metrics, setMetrics] = useState<MetricGroup[]>([])
  const [activeTab, setActiveTab] = useState<'health' | 'logs' | 'metrics' | 'errors'>('health')
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)

  const fetchData = async (component?: string) => {
    try {
      setLoading(true)
      const endpoint = component ? `/api/admin/health?component=${component}` : '/api/admin/health'
      const response = await fetch(endpoint)
      const data = await response.json()

      if (component === 'logs') {
        setLogs(data.logs || [])
      } else if (component === 'metrics') {
        setMetrics(data.metrics || [])
      } else {
        setHealth(data)
      }
    } catch (error) {
      console.error('Failed to fetch observability data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    if (autoRefresh) {
      const interval = setInterval(() => {
        if (activeTab === 'health') {
          fetchData()
        } else {
          fetchData(activeTab)
        }
      }, 30000) // Refresh every 30 seconds
      
      return () => clearInterval(interval)
    }
  }, [autoRefresh, activeTab])

  useEffect(() => {
    if (activeTab !== 'health') {
      fetchData(activeTab)
    }
  }, [activeTab])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'up':
        return 'text-green-600 bg-green-100'
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      case 'unhealthy':
      case 'down':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-100'
      case 'warn':
        return 'text-yellow-600 bg-yellow-100'
      case 'info':
        return 'text-blue-600 bg-blue-100'
      case 'debug':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const tabs = [
    { id: 'health', label: 'System Health', icon: '🏥' },
    { id: 'logs', label: 'Logs', icon: '📋' },
    { id: 'metrics', label: 'Metrics', icon: '📊' },
    { id: 'errors', label: 'Errors', icon: '🚨' },
  ] as const

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">System Observability</h1>
              <p className="text-gray-600">Monitor system health, logs, metrics, and errors</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Auto-refresh</span>
              </label>
              
              <button
                onClick={() => fetchData(activeTab === 'health' ? undefined : activeTab)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading observability data...</span>
          </div>
        )}

        {/* Health Tab */}
        {!loading && activeTab === 'health' && health && (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">System Status</h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(health.status)}`}>
                  {health.status.toUpperCase()}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {(health.metrics.errorRate * 100).toFixed(2)}%
                  </div>
                  <div className="text-sm text-gray-600">Error Rate</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {health.metrics.avgResponseTime.toFixed(0)}ms
                  </div>
                  <div className="text-sm text-gray-600">Avg Response Time</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {health.metrics.rateLimitHits}
                  </div>
                  <div className="text-sm text-gray-600">Rate Limit Hits</div>
                </div>
              </div>
            </div>

            {/* Services Status */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Services</h2>
              <div className="space-y-3">
                {Object.entries(health.services).map(([service, data]) => (
                  <div key={service} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 capitalize">{service}</span>
                      {data.latency && (
                        <span className="ml-2 text-sm text-gray-600">({data.latency}ms)</span>
                      )}
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(data.status)}`}>
                      {data.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logs Tab */}
        {!loading && activeTab === 'logs' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Recent Logs</h2>
              <p className="text-sm text-gray-600">Last 1000 log entries</p>
            </div>
            
            <div className="max-h-96 overflow-y-auto">
              {logs.length === 0 ? (
                <div className="p-6 text-center text-gray-500">No logs available</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {logs.map((log, index) => (
                    <div key={index} className="p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getLevelColor(log.level)}`}>
                              {log.level.toUpperCase()}
                            </span>
                            <span className="text-sm text-gray-500">
                              {format(new Date(log.timestamp), 'MMM dd, HH:mm:ss')}
                            </span>
                          </div>
                          <div className="text-sm text-gray-900 font-medium">{log.message}</div>
                          {log.context && (
                            <div className="mt-1 text-xs text-gray-600">
                              <pre className="whitespace-pre-wrap">{JSON.stringify(log.context, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Metrics Tab */}
        {!loading && activeTab === 'metrics' && (
          <div className="space-y-6">
            {metrics.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                No metrics available
              </div>
            ) : (
              metrics.map((metric) => (
                <div key={metric.name} className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{metric.name}</h3>
                    <div className="text-sm text-gray-600">
                      {metric.values.length} data points
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{metric.stats.count}</div>
                      <div className="text-xs text-gray-600">Count</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{metric.stats.avg.toFixed(2)}</div>
                      <div className="text-xs text-gray-600">Average</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{metric.stats.min}</div>
                      <div className="text-xs text-gray-600">Min</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{metric.stats.max}</div>
                      <div className="text-xs text-gray-600">Max</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{metric.stats.sum.toFixed(0)}</div>
                      <div className="text-xs text-gray-600">Sum</div>
                    </div>
                  </div>
                  
                  {/* Recent values */}
                  <div className="text-sm">
                    <div className="font-medium text-gray-700 mb-2">Recent Values:</div>
                    <div className="max-h-32 overflow-y-auto">
                      {metric.values.slice(0, 10).map((value, index) => (
                        <div key={index} className="flex justify-between py-1">
                          <span>{format(new Date(value.timestamp), 'HH:mm:ss')}</span>
                          <span className="font-medium">{value.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
