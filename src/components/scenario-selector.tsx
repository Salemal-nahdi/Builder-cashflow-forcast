'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Scenario {
  id: string
  name: string
  description: string | null
  isBase: boolean
}

interface ScenarioSelectorProps {
  organizationId: string
}

export function ScenarioSelector({ organizationId }: ScenarioSelectorProps) {
  const [scenarios, setScenarios] = useState<Scenario[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedScenario, setSelectedScenario] = useState<string>('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    fetchScenarios()
  }, [organizationId])

  useEffect(() => {
    const scenarioParam = searchParams.get('scenario')
    if (scenarioParam) {
      setSelectedScenario(scenarioParam)
    } else {
      // Default to base scenario
      const baseScenario = scenarios.find(s => s.isBase)
      if (baseScenario) {
        setSelectedScenario(baseScenario.id)
      }
    }
  }, [scenarios, searchParams])

  const fetchScenarios = async () => {
    setLoading(true)
    try {
      // Mock data for now - in real implementation, this would fetch from API
      const mockScenarios: Scenario[] = [
        {
          id: 'base',
          name: 'Base Forecast',
          description: 'Current project timelines and assumptions',
          isBase: true,
        },
        {
          id: 'optimistic',
          name: 'Optimistic',
          description: 'Best case scenario with accelerated payments',
          isBase: false,
        },
        {
          id: 'pessimistic',
          name: 'Pessimistic',
          description: 'Worst case scenario with delays and cost overruns',
          isBase: false,
        },
      ]
      
      setTimeout(() => {
        setScenarios(mockScenarios)
        setLoading(false)
      }, 500)
    } catch (error) {
      console.error('Error fetching scenarios:', error)
      setLoading(false)
    }
  }

  const handleScenarioChange = (scenarioId: string) => {
    setSelectedScenario(scenarioId)
    
    // Update URL with scenario parameter
    const params = new URLSearchParams(searchParams.toString())
    if (scenarioId === 'base' || scenarioId === '') {
      params.delete('scenario')
    } else {
      params.set('scenario', scenarioId)
    }
    
    const queryString = params.toString()
    router.push(`/forecast${queryString ? `?${queryString}` : ''}`)
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-32 h-10 bg-gray-200 rounded-md animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="scenario" className="text-sm font-medium text-gray-700">
        Scenario:
      </label>
      <select
        id="scenario"
        value={selectedScenario}
        onChange={(e) => handleScenarioChange(e.target.value)}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
      >
        {scenarios.map((scenario) => (
          <option key={scenario.id} value={scenario.id}>
            {scenario.name}
          </option>
        ))}
      </select>
      
      {selectedScenario && selectedScenario !== 'base' && (
        <button
          onClick={() => router.push(`/scenarios/${selectedScenario}`)}
          className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Edit
        </button>
      )}
      
      <button
        onClick={() => router.push('/scenarios')}
        className="px-3 py-2 text-sm bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
      >
        Manage
      </button>
    </div>
  )
}
