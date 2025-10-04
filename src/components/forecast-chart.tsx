'use client'

import { useEffect, useState } from 'react'
import ReactECharts from 'echarts-for-react'
import { format, startOfMonth, addMonths } from 'date-fns'

interface ForecastChartProps {
  organizationId: string
  scenarioId?: string
}

interface ForecastData {
  periods: Array<{
    startDate: string
    endDate: string
    income: number
    outgo: number
    net: number
    balance: number
  }>
}

export function ForecastChart({ organizationId, scenarioId }: ForecastChartProps) {
  const [data, setData] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<'monthly' | 'weekly'>('monthly')

  useEffect(() => {
    fetchForecastData()
  }, [organizationId, scenarioId])

  const fetchForecastData = async () => {
    setLoading(true)
    try {
      // Mock data for now - in real implementation, this would fetch from API
      const mockData: ForecastData = {
        periods: [
          { startDate: '2024-01-01', endDate: '2024-01-31', income: 45000, outgo: 32000, net: 13000, balance: 125000 },
          { startDate: '2024-02-01', endDate: '2024-02-29', income: 52000, outgo: 38000, net: 14000, balance: 139000 },
          { startDate: '2024-03-01', endDate: '2024-03-31', income: 48000, outgo: 41000, net: 7000, balance: 146000 },
          { startDate: '2024-04-01', endDate: '2024-04-30', income: 55000, outgo: 45000, net: 10000, balance: 156000 },
          { startDate: '2024-05-01', endDate: '2024-05-31', income: 60000, outgo: 50000, net: 10000, balance: 166000 },
          { startDate: '2024-06-01', endDate: '2024-06-30', income: 58000, outgo: 52000, net: 6000, balance: 172000 },
          { startDate: '2024-07-01', endDate: '2024-07-31', income: 62000, outgo: 48000, net: 14000, balance: 186000 },
          { startDate: '2024-08-01', endDate: '2024-08-31', income: 65000, outgo: 55000, net: 10000, balance: 196000 },
          { startDate: '2024-09-01', endDate: '2024-09-30', income: 58000, outgo: 52000, net: 6000, balance: 202000 },
          { startDate: '2024-10-01', endDate: '2024-10-31', income: 60000, outgo: 50000, net: 10000, balance: 212000 },
          { startDate: '2024-11-01', endDate: '2024-11-30', income: 55000, outgo: 48000, net: 7000, balance: 219000 },
          { startDate: '2024-12-01', endDate: '2024-12-31', income: 62000, outgo: 55000, net: 7000, balance: 226000 },
        ]
      }
      
      setTimeout(() => {
        setData(mockData)
        setLoading(false)
      }, 1000)
    } catch (error) {
      console.error('Error fetching forecast data:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const chartOption = {
    title: {
      text: 'Cashflow Forecast',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold',
      },
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#999'
        }
      },
      formatter: function(params: any) {
        const period = params[0]
        const data = period.data
        return `
          <div style="padding: 10px;">
            <div style="font-weight: bold; margin-bottom: 5px;">${format(new Date(period.name), 'MMM yyyy')}</div>
            <div style="color: #10B981;">Income: $${data.income.toLocaleString()}</div>
            <div style="color: #EF4444;">Outgo: $${data.outgo.toLocaleString()}</div>
            <div style="color: #3B82F6;">Net: $${data.net.toLocaleString()}</div>
            <div style="color: #6B7280;">Balance: $${data.balance.toLocaleString()}</div>
          </div>
        `
      }
    },
    legend: {
      data: ['Income', 'Outgo', 'Net Cashflow', 'Balance'],
      top: 30,
    },
    xAxis: {
      type: 'category',
      data: data.periods.map(p => format(new Date(p.startDate), 'MMM yyyy')),
      axisPointer: {
        type: 'shadow'
      }
    },
    yAxis: [
      {
        type: 'value',
        name: 'Amount ($)',
        position: 'left',
        axisLabel: {
          formatter: function(value: number) {
            return '$' + (value / 1000) + 'k'
          }
        }
      },
      {
        type: 'value',
        name: 'Balance ($)',
        position: 'right',
        axisLabel: {
          formatter: function(value: number) {
            return '$' + (value / 1000) + 'k'
          }
        }
      }
    ],
    series: [
      {
        name: 'Income',
        type: 'bar',
        data: data.periods.map(p => p.income),
        itemStyle: {
          color: '#10B981'
        }
      },
      {
        name: 'Outgo',
        type: 'bar',
        data: data.periods.map(p => p.outgo),
        itemStyle: {
          color: '#EF4444'
        }
      },
      {
        name: 'Net Cashflow',
        type: 'line',
        yAxisIndex: 0,
        data: data.periods.map(p => p.net),
        itemStyle: {
          color: '#3B82F6'
        },
        lineStyle: {
          width: 3
        }
      },
      {
        name: 'Balance',
        type: 'line',
        yAxisIndex: 1,
        data: data.periods.map(p => p.balance),
        itemStyle: {
          color: '#6B7280'
        },
        lineStyle: {
          width: 2,
          type: 'dashed'
        }
      }
    ],
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100,
        handleIcon: 'M10.7,11.9v-1.3H9.3v1.3c-4.9,0.3-8.8,4.4-8.8,9.4c0,5,3.9,9.1,8.8,9.4v1.3h1.3v-1.3c4.9-0.3,8.8-4.4,8.8-9.4C19.5,16.3,15.6,12.2,10.7,11.9z M13.3,24.4H6.7V23h6.6V24.4z M13.3,19.6H6.7v-1.4h6.6V19.6z',
        handleSize: '80%',
        handleStyle: {
          color: '#fff',
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.6)',
          shadowOffsetX: 2,
          shadowOffsetY: 2
        }
      }
    ]
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Cashflow Timeline</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('monthly')}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'monthly' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setViewMode('weekly')}
            className={`px-3 py-1 text-sm rounded-md ${
              viewMode === 'weekly' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Weekly
          </button>
        </div>
      </div>

      <div className="h-96">
        <ReactECharts 
          option={chartOption} 
          style={{ height: '100%', width: '100%' }}
          opts={{ renderer: 'canvas' }}
        />
      </div>

      {/* Key Insights */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-green-800">Peak Income Month</h3>
          <p className="text-lg font-bold text-green-900">
            {data.periods.reduce((max, p) => p.income > max.income ? p : max, data.periods[0]).income > 0 
              ? `$${data.periods.reduce((max, p) => p.income > max.income ? p : max, data.periods[0]).income.toLocaleString()}`
              : 'No income projected'
            }
          </p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-red-800">Highest Outgo Month</h3>
          <p className="text-lg font-bold text-red-900">
            ${data.periods.reduce((max, p) => p.outgo > max.outgo ? p : max, data.periods[0]).outgo.toLocaleString()}
          </p>
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800">Projected Balance</h3>
          <p className="text-lg font-bold text-blue-900">
            ${data.periods[data.periods.length - 1].balance.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
