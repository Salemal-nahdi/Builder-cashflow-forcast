'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Project {
  id: string
  name: string
}

interface VarianceFiltersProps {
  projects: Project[]
  currentFilters: {
    project?: string
    confidence?: string
    status?: string
  }
}

export function VarianceFilters({ projects, currentFilters }: VarianceFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [project, setProject] = useState(currentFilters.project || '')
  const [confidence, setConfidence] = useState(currentFilters.confidence || '')
  const [status, setStatus] = useState(currentFilters.status || '')

  const updateFilters = () => {
    const params = new URLSearchParams()
    
    if (project) params.set('project', project)
    if (confidence) params.set('confidence', confidence)
    if (status) params.set('status', status)
    
    const queryString = params.toString()
    router.push(`/variance${queryString ? `?${queryString}` : ''}`)
  }

  const clearFilters = () => {
    setProject('')
    setConfidence('')
    setStatus('')
    router.push('/variance')
  }

  const hasActiveFilters = project || confidence || status

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Project Filter */}
        <div>
          <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
            Project
          </label>
          <select
            id="project"
            value={project}
            onChange={(e) => setProject(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>

        {/* Confidence Filter */}
        <div>
          <label htmlFor="confidence" className="block text-sm font-medium text-gray-700 mb-1">
            Confidence Level
          </label>
          <select
            id="confidence"
            value={confidence}
            onChange={(e) => setConfidence(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Levels</option>
            <option value="0.8">High (80%+)</option>
            <option value="0.6">Medium (60%+)</option>
            <option value="0.4">Low (40%+)</option>
          </select>
        </div>

        {/* Status Filter */}
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
            <option value="matched">Matched</option>
            <option value="disputed">Disputed</option>
            <option value="resolved">Resolved</option>
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
          {project && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Project: {projects.find(p => p.id === project)?.name}
              <button
                onClick={() => {
                  setProject('')
                  updateFilters()
                }}
                className="ml-1 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}
          {confidence && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Confidence: {confidence === '0.8' ? 'High' : confidence === '0.6' ? 'Medium' : 'Low'}
              <button
                onClick={() => {
                  setConfidence('')
                  updateFilters()
                }}
                className="ml-1 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}
          {status && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Status: {status}
              <button
                onClick={() => {
                  setStatus('')
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
