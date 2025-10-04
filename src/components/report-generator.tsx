'use client'

import { useState } from 'react'

interface Project {
  id: string
  name: string
}

interface OrganizationSettings {
  id: string
  logoUrl: string | null
  primaryColor: string | null
  secondaryColor: string | null
}

interface ReportGeneratorProps {
  organizationId: string
  projects: Project[]
  organizationSettings: OrganizationSettings | null
}

export function ReportGenerator({ organizationId, projects, organizationSettings }: ReportGeneratorProps) {
  const [reportType, setReportType] = useState('forecast')
  const [format, setFormat] = useState('csv')
  const [selectedProjects, setSelectedProjects] = useState<string[]>([])
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: '',
  })
  const [includeCharts, setIncludeCharts] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleProjectToggle = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    )
  }

  const handleSelectAllProjects = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([])
    } else {
      setSelectedProjects(projects.map(p => p.id))
    }
  }

  const handleGenerateReport = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: reportType,
          format,
          projectIds: selectedProjects,
          dateRange,
          includeCharts,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.fileUrl) {
          // Download the file
          window.open(result.fileUrl, '_blank')
        }
      } else {
        throw new Error('Failed to generate report')
      }
    } catch (error) {
      console.error('Error generating report:', error)
      alert('Failed to generate report. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Generate Custom Report</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report Configuration */}
        <div className="space-y-6">
          {/* Report Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="forecast">Cashflow Forecast</option>
              <option value="variance">Variance Analysis</option>
              <option value="consolidated">Consolidated Report</option>
              <option value="project">Project Summary</option>
            </select>
          </div>

          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Format
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">CSV</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="pdf"
                  checked={format === 'pdf'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">PDF</span>
              </label>
            </div>
          </div>

          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date Range
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Start Date</label>
                <input
                  type="date"
                  value={dateRange.startDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">End Date</label>
                <input
                  type="date"
                  value={dateRange.endDate}
                  onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* PDF Options */}
          {format === 'pdf' && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Include Charts</span>
              </label>
            </div>
          )}
        </div>

        {/* Project Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <label className="block text-sm font-medium text-gray-700">
              Projects
            </label>
            <button
              onClick={handleSelectAllProjects}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {selectedProjects.length === projects.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-md p-4">
            {projects.length === 0 ? (
              <p className="text-sm text-gray-500">No projects available</p>
            ) : (
              <div className="space-y-2">
                {projects.map((project) => (
                  <label key={project.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedProjects.includes(project.id)}
                      onChange={() => handleProjectToggle(project.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">{project.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          
          <p className="text-xs text-gray-500 mt-2">
            {selectedProjects.length} of {projects.length} projects selected
          </p>
        </div>
      </div>

      {/* Generate Button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleGenerateReport}
          disabled={isGenerating || selectedProjects.length === 0}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? 'Generating...' : 'Generate Report'}
        </button>
      </div>
    </div>
  )
}
