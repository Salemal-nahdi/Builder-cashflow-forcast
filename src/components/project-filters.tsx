'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface ProjectGroup {
  id: string
  name: string
  color: string | null
}

interface ProjectFiltersProps {
  projectGroups: ProjectGroup[]
  currentFilters: {
    search?: string
    status?: string
    group?: string
  }
}

export function ProjectFilters({ projectGroups, currentFilters }: ProjectFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentFilters.search || '')
  const [status, setStatus] = useState(currentFilters.status || '')
  const [group, setGroup] = useState(currentFilters.group || '')

  const updateFilters = () => {
    const params = new URLSearchParams()
    
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    if (group) params.set('group', group)
    
    const queryString = params.toString()
    router.push(`/projects${queryString ? `?${queryString}` : ''}`)
  }

  const clearFilters = () => {
    setSearch('')
    setStatus('')
    setGroup('')
    router.push('/projects')
  }

  const hasActiveFilters = search || status || group

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            type="text"
            id="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Project name or description..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status */}
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="on_hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Project Group */}
        <div>
          <label htmlFor="group" className="block text-sm font-medium text-gray-700 mb-1">
            Project Group
          </label>
          <select
            id="group"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Groups</option>
            {projectGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex items-end space-x-2">
          <button
            onClick={updateFilters}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Apply Filters
          </button>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm text-gray-600">Active filters:</span>
          {search && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Search: {search}
              <button
                onClick={() => {
                  setSearch('')
                  updateFilters()
                }}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          {status && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Status: {status.replace('_', ' ')}
              <button
                onClick={() => {
                  setStatus('')
                  updateFilters()
                }}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}
          {group && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Group: {projectGroups.find(g => g.id === group)?.name}
              <button
                onClick={() => {
                  setGroup('')
                  updateFilters()
                }}
                className="ml-1 text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}
