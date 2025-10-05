'use client'

import { useState } from 'react'
import Link from 'next/link'
import { addMonths, addDays, format } from 'date-fns'
import { DemoForecastChart } from '@/components/demo-forecast-chart'
import { MilestoneProjectCard } from '@/components/milestone-project-card'
import { AddProjectModal } from '@/components/add-project-modal'
import { ForecastViewControls } from '@/components/forecast-view-controls'
import { ForecastTableView } from '@/components/forecast-table-view'
import { ForecastGanttView } from '@/components/forecast-gantt-view'
import { ForecastByProjectView } from '@/components/forecast-by-project-view'

// Enhanced data model with flexible payment dates
interface CostItem {
  id: string
  description: string
  amount: number
  vendor?: string
  paymentOffset: number // Days relative to income date (can be negative)
  status: 'pending' | 'paid'
}

interface Milestone {
  id: string
  name: string
  month: number
  incomeAmount: number
  status: 'completed' | 'in-progress' | 'pending'
  // Simple cost model (single payment with offset)
  usesSimpleCost?: boolean
  costAmount?: number
  costPaymentOffset?: number // Days after income (negative = before)
  // Detailed cost model (multiple items)
  costItems?: CostItem[]
}

interface DemoProject {
  id: string
  name: string
  status: string
  progress: number
  contractValue: number
  expectedCompletion: Date
  startDate: Date
  milestones: Milestone[]
}

// Initial mock data for demo
const initialProjects: DemoProject[] = [
  {
    id: '1',
    name: 'Residential Complex - Phase 1',
    status: 'active',
    progress: 75,
    contractValue: 850000,
    startDate: new Date('2024-01-01'),
    expectedCompletion: new Date('2024-06-15'),
    milestones: [
      { 
        id: '1-1', 
        name: 'Foundation Complete', 
        month: 1, 
        incomeAmount: 150000, 
        status: 'completed',
        usesSimpleCost: true,
        costAmount: 120000,
        costPaymentOffset: -14, // Pay 14 days BEFORE income
      },
      { 
        id: '1-2', 
        name: 'Frame & Roof', 
        month: 2, 
        incomeAmount: 200000, 
        status: 'completed',
        usesSimpleCost: false,
        costItems: [
          { id: '1-2-1', description: 'Timber Supply', amount: 80000, vendor: 'TimberCo', paymentOffset: -7, status: 'paid' },
          { id: '1-2-2', description: 'Roofing Materials', amount: 50000, vendor: 'RoofPro', paymentOffset: 0, status: 'paid' },
          { id: '1-2-3', description: 'Labor', amount: 30000, vendor: 'Construction Crew', paymentOffset: 7, status: 'paid' },
        ]
      },
      { 
        id: '1-3', 
        name: 'Interior Rough-in', 
        month: 3, 
        incomeAmount: 180000, 
        status: 'completed',
        usesSimpleCost: true,
        costAmount: 140000,
        costPaymentOffset: 7, // Pay 7 days AFTER income
      },
      { 
        id: '1-4', 
        name: 'Finishing Work', 
        month: 4, 
        incomeAmount: 220000, 
        status: 'in-progress',
        usesSimpleCost: false,
        costItems: [
          { id: '1-4-1', description: 'Paint & Finishes', amount: 60000, vendor: 'FinishPro', paymentOffset: 0, status: 'pending' },
          { id: '1-4-2', description: 'Flooring', amount: 70000, vendor: 'FloorMaster', paymentOffset: 14, status: 'pending' },
          { id: '1-4-3', description: 'Fixtures', amount: 50000, vendor: 'FixturePlus', paymentOffset: 30, status: 'pending' },
        ]
      },
      { 
        id: '1-5', 
        name: 'Final Completion', 
        month: 5, 
        incomeAmount: 100000, 
        status: 'pending',
        usesSimpleCost: true,
        costAmount: 80000,
        costPaymentOffset: 0, // Same day as income
      },
    ],
  },
  {
    id: '2', 
    name: 'Commercial Office Building',
    status: 'planning',
    progress: 25,
    contractValue: 1200000,
    startDate: new Date('2024-02-01'),
    expectedCompletion: new Date('2024-09-30'),
    milestones: [
      { 
        id: '2-1', 
        name: 'Site Preparation', 
        month: 1, 
        incomeAmount: 50000, 
        status: 'pending',
        usesSimpleCost: true,
        costAmount: 40000,
        costPaymentOffset: -30, // Pay 30 days before (deposit)
      },
      { 
        id: '2-2', 
        name: 'Foundation & Structure', 
        month: 3, 
        incomeAmount: 400000, 
        status: 'pending',
        usesSimpleCost: false,
        costItems: [
          { id: '2-2-1', description: 'Concrete', amount: 150000, vendor: 'ConcreteCo', paymentOffset: -14, status: 'pending' },
          { id: '2-2-2', description: 'Steel', amount: 100000, vendor: 'SteelWorks', paymentOffset: -7, status: 'pending' },
          { id: '2-2-3', description: 'Labor', amount: 70000, vendor: 'BuildCrew', paymentOffset: 7, status: 'pending' },
        ]
      },
      { 
        id: '2-3', 
        name: 'Mechanical & Electrical', 
        month: 4, 
        incomeAmount: 300000, 
        status: 'pending',
        usesSimpleCost: true,
        costAmount: 240000,
        costPaymentOffset: 14,
      },
      { 
        id: '2-4', 
        name: 'Interior & Finishing', 
        month: 5, 
        incomeAmount: 350000, 
        status: 'pending',
        usesSimpleCost: true,
        costAmount: 280000,
        costPaymentOffset: 30,
      },
      { 
        id: '2-5', 
        name: 'Final Inspection', 
        month: 6, 
        incomeAmount: 100000, 
        status: 'pending',
        usesSimpleCost: true,
        costAmount: 50000,
        costPaymentOffset: 0,
      },
    ],
  },
  {
    id: '3',
    name: 'School Renovation Project',
    status: 'active',
    progress: 90,
    contractValue: 450000,
    startDate: new Date('2023-12-01'),
    expectedCompletion: new Date('2024-04-20'),
    milestones: [
      { 
        id: '3-1', 
        name: 'Demolition', 
        month: 0, 
        incomeAmount: 75000, 
        status: 'completed',
        usesSimpleCost: true,
        costAmount: 60000,
        costPaymentOffset: 0,
      },
      { 
        id: '3-2', 
        name: 'Structural Updates', 
        month: 1, 
        incomeAmount: 150000, 
        status: 'completed',
        usesSimpleCost: true,
        costAmount: 120000,
        costPaymentOffset: 7,
      },
      { 
        id: '3-3', 
        name: 'New Systems Install', 
        month: 2, 
        incomeAmount: 125000, 
        status: 'completed',
        usesSimpleCost: true,
        costAmount: 100000,
        costPaymentOffset: 14,
      },
      { 
        id: '3-4', 
        name: 'Finishes & Cleanup', 
        month: 3, 
        incomeAmount: 100000, 
        status: 'completed',
        usesSimpleCost: true,
        costAmount: 80000,
        costPaymentOffset: 7,
      },
    ],
  },
]

// Base costs that don't change (overhead, materials, etc.)
const baseCosts = {
  monthly: [120000, 90000, 110000, 130000, 80000, 80000], // Jan-Jun
  balance: 150000, // Starting balance
}

export default function DemoPage() {
  const [projects, setProjects] = useState<DemoProject[]>(initialProjects)
  const [startingBalance, setStartingBalance] = useState(baseCosts.balance)
  const [monthlyOverheads, setMonthlyOverheads] = useState([...baseCosts.monthly])
  const [showAddProjectModal, setShowAddProjectModal] = useState(false)
  const [showOverheadSettings, setShowOverheadSettings] = useState(false)
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly')
  const [chartType, setChartType] = useState<'bar' | 'line' | 'area' | 'table' | 'gantt' | 'by-project'>('bar')

  // Calculate forecast data with proper payment timing
  const calculateForecastData = () => {
    const baseDate = new Date('2024-01-01')
    
    // Create cash events from all projects
    const cashEvents: Array<{
      date: Date
      type: 'income' | 'cost' | 'overhead'
      amount: number
      description: string
      project?: string
    }> = []

    // Add project income and cost events
    projects.forEach(project => {
      project.milestones.forEach(milestone => {
        const incomeDate = addMonths(baseDate, milestone.month)
        
        // Add income event
        cashEvents.push({
          date: incomeDate,
          type: 'income',
          amount: milestone.incomeAmount,
          description: `${project.name} - ${milestone.name}`,
          project: project.id
        })

        // Add cost events based on payment model
        if (milestone.usesSimpleCost) {
          // Simple model: single payment with offset
          const costDate = addDays(incomeDate, milestone.costPaymentOffset || 0)
          cashEvents.push({
            date: costDate,
            type: 'cost',
            amount: milestone.costAmount || 0,
            description: `${project.name} - ${milestone.name} (Costs)`,
            project: project.id
          })
        } else if (milestone.costItems) {
          // Detailed model: multiple cost items with individual offsets
          milestone.costItems.forEach(cost => {
            const costDate = addDays(incomeDate, cost.paymentOffset)
            cashEvents.push({
              date: costDate,
              type: 'cost',
              amount: cost.amount,
              description: `${project.name} - ${cost.description}`,
              project: project.id
            })
          })
        }
      })
    })

    // Add overhead costs
    if (viewMode === 'weekly') {
      // Weekly overheads (divide monthly by ~4.33 weeks)
      for (let week = 0; week < 26; week++) {
        const weekDate = addDays(baseDate, week * 7)
        const monthIndex = Math.floor(week / 4.33)
        if (monthIndex < monthlyOverheads.length) {
          cashEvents.push({
            date: weekDate,
            type: 'overhead',
            amount: monthlyOverheads[monthIndex] / 4.33,
            description: 'Weekly Overheads'
          })
        }
      }
    } else {
      // Monthly overheads
      monthlyOverheads.forEach((amount, index) => {
        const overheadDate = addMonths(baseDate, index)
        cashEvents.push({
          date: overheadDate,
          type: 'overhead',
          amount,
          description: 'Monthly Overheads'
        })
      })
    }

    // Generate periods based on view mode
    let periods: Array<{ label: string; start: Date; end: Date }> = []
    
    if (viewMode === 'weekly') {
      // Generate 26 weeks (6 months)
      for (let week = 0; week < 26; week++) {
        const weekStart = addDays(baseDate, week * 7)
        const weekEnd = addDays(weekStart, 7)
        periods.push({
          label: `Week ${week + 1} '24`,
          start: weekStart,
          end: weekEnd
        })
      }
    } else {
      // Monthly periods
      const monthNames = ['Jan 2024', 'Feb 2024', 'Mar 2024', 'Apr 2024', 'May 2024', 'Jun 2024']
      monthNames.forEach((month, index) => {
        const monthStart = addMonths(baseDate, index)
        const monthEnd = addMonths(baseDate, index + 1)
        periods.push({
          label: month,
          start: monthStart,
          end: monthEnd
        })
      })
    }

    // Aggregate by period
    let runningBalance = startingBalance
    
    return periods.map((period) => {
      // Get all events in this period
      const periodEvents = cashEvents.filter(event => 
        event.date >= period.start && event.date < period.end
      )

      const totalIncome = periodEvents
        .filter(e => e.type === 'income')
        .reduce((sum, e) => sum + e.amount, 0)

      const projectCosts = periodEvents
        .filter(e => e.type === 'cost')
        .reduce((sum, e) => sum + e.amount, 0)

      const overheadCosts = periodEvents
        .filter(e => e.type === 'overhead')
        .reduce((sum, e) => sum + e.amount, 0)

      const outgo = projectCosts + overheadCosts
      const net = totalIncome - outgo
      runningBalance += net

      return {
        month: period.label,
        income: totalIncome,
        outgo,
        net,
        balance: runningBalance,
        projectCosts,
        overheadCosts,
      }
    })
  }

  const forecastData = calculateForecastData()

  const updateProject = (projectId: string, updates: Partial<DemoProject>) => {
    setProjects(prev => prev.map(project => 
      project.id === projectId ? { ...project, ...updates } : project
    ))
  }

  const addProject = (newProject: DemoProject) => {
    setProjects(prev => [...prev, newProject])
    setShowAddProjectModal(false)
  }

  const deleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId))
  }

  const totalContractValue = projects.reduce((sum, project) => sum + Number(project.contractValue), 0)
  const activeProjects = projects.filter(p => p.status === 'active').length
  const lastPeriodIndex = viewMode === 'weekly' ? 25 : 5
  const currentMonthNet = forecastData[lastPeriodIndex]?.net || 0
  const finalBalance = forecastData[lastPeriodIndex]?.balance || startingBalance

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Builder Forecasting Software</h1>
              <p className="text-gray-600">Interactive Demo Dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-gray-900"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Interactive Demo Notice */}
        <div className="mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Interactive Demo
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>
                    📊 <strong>Try it out!</strong> Edit project values below and watch the cashflow chart update in real-time. 
                    Change contract values, adjust monthly income distribution, or modify the starting balance to see immediate impact on your forecast.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Forecast Settings</h3>
              <button
                onClick={() => setShowOverheadSettings(!showOverheadSettings)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span>{showOverheadSettings ? 'Hide' : 'Edit'} Monthly Overheads</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startingBalance" className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Cash Balance
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="startingBalance"
                    value={startingBalance}
                    onChange={(e) => setStartingBalance(Number(e.target.value))}
                    className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  Adjust starting balance and monthly overheads to model different scenarios
                </div>
              </div>
            </div>

            {/* Monthly Overheads Editor */}
            {showOverheadSettings && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-4">Monthly Fixed Costs (Overheads)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => (
                    <div key={month}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {month} 2024
                      </label>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-xs text-gray-500">$</span>
                        <input
                          type="number"
                          value={monthlyOverheads[index]}
                          onChange={(e) => {
                            const newOverheads = [...monthlyOverheads]
                            newOverheads[index] = Number(e.target.value)
                            setMonthlyOverheads(newOverheads)
                          }}
                          className="w-full pl-6 pr-2 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Total for 6 Months: <span className="font-semibold text-gray-900">
                      ${monthlyOverheads.reduce((sum, val) => sum + val, 0).toLocaleString()}
                    </span>
                    {' '}(Avg: ${Math.round(monthlyOverheads.reduce((sum, val) => sum + val, 0) / 6).toLocaleString()}/month)
                  </div>
                  <button
                    onClick={() => setMonthlyOverheads([...baseCosts.monthly])}
                    className="text-sm text-gray-600 hover:text-gray-800 underline"
                  >
                    Reset to Defaults
                  </button>
                </div>
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-4 w-4 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-2">
                      <p className="text-xs text-blue-800">
                        <strong>Tip:</strong> Fixed costs include rent, utilities, salaries, insurance, and other monthly overheads. Changes update all forecast views instantly!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Projected Balance</p>
                <p className="text-2xl font-bold text-green-600">${finalBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-blue-600">{activeProjects}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">
                  {viewMode === 'weekly' ? 'Last Week' : 'Latest Period'} Net Cashflow
                </p>
                <p className={`text-2xl font-bold ${currentMonthNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${currentMonthNet.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">Total Contract Value</p>
                <p className="text-2xl font-bold text-orange-600">${(totalContractValue / 1000000).toFixed(1)}M</p>
              </div>
            </div>
          </div>
        </div>

        {/* Forecast View Controls */}
        <ForecastViewControls
          viewMode={viewMode}
          chartType={chartType}
          onViewModeChange={setViewMode}
          onChartTypeChange={setChartType}
        />

        {/* Cashflow Forecast Visualization */}
        <div className="mb-8">
          {chartType === 'table' ? (
            <ForecastTableView data={forecastData} />
          ) : chartType === 'gantt' ? (
            <ForecastGanttView projects={projects} />
          ) : chartType === 'by-project' ? (
            <ForecastByProjectView 
              projects={projects} 
              viewMode={viewMode}
              overheadCosts={{ monthly: monthlyOverheads }}
              startingBalance={startingBalance}
            />
          ) : (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {viewMode === 'weekly' ? '26-Week' : '6-Month'} Cashflow Forecast 
                <span className="text-sm font-normal text-gray-600 ml-2">
                  ({viewMode === 'weekly' ? 'Weekly' : 'Monthly'} view • Updates automatically)
                </span>
              </h2>
              <DemoForecastChart data={forecastData} chartType={chartType as 'bar' | 'line' | 'area'} />
            </div>
          )}
        </div>

        {/* Projects Grid - Editable */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Projects 
                <span className="text-sm font-normal text-gray-600 ml-2">(Click &quot;Edit&quot; to modify milestone payments & costs)</span>
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {projects.length} total project{projects.length !== 1 ? 's' : ''} • Adjust payment timing relative to income dates
              </p>
            </div>
            <button
              onClick={() => setShowAddProjectModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add Project</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <MilestoneProjectCard 
                key={project.id} 
                project={project} 
                onUpdate={(updates) => updateProject(project.id, updates)}
              />
            ))}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">How to Use This Interactive Demo</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-2">💰 Edit Progress Payments & Costs:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Click &quot;Edit Payments & Costs&quot; on any project</li>
                <li>• Modify milestone payment amounts</li>
                <li>• Adjust associated cost estimates</li>
                <li>• Change payment timing (months)</li>
                <li>• See real-time margin calculations</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">📊 Real-time Impact Analysis:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Cashflow chart updates instantly</li>
                <li>• Project margins recalculate automatically</li>
                <li>• Balance projections adjust in real-time</li>
                <li>• See impact on overall cash position</li>
                <li>• Test different payment schedules</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-4 bg-blue-100 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">💡 Try These Scenarios:</h4>
            <div className="grid md:grid-cols-3 gap-4 text-xs text-blue-800">
              <div>
                <strong>Increase margins:</strong> Reduce costs on the Commercial Office Building project
              </div>
              <div>
                <strong>Improve cashflow:</strong> Move payments earlier in the School Renovation
              </div>
              <div>
                <strong>What-if analysis:</strong> Add a new milestone to any project
              </div>
            </div>
          </div>
        </div>

        {/* Add Project Modal */}
        {showAddProjectModal && (
          <AddProjectModal
            onClose={() => setShowAddProjectModal(false)}
            onAdd={addProject}
          />
        )}
      </div>
    </div>
  )
}