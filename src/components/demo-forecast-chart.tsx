'use client'

import { useEffect, useRef } from 'react'

interface ForecastData {
  month: string
  income: number
  outgo: number
  net: number
  balance: number
}

interface DemoForecastChartProps {
  data: ForecastData[]
  chartType?: 'bar' | 'line' | 'area'
}

export function DemoForecastChart({ data, chartType = 'area' }: DemoForecastChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!chartRef.current || !data.length) return

    const maxValue = Math.max(...data.map(d => Math.max(d.income, d.outgo, d.balance)), 100000)
    const minValue = Math.min(...data.map(d => Math.min(d.income, d.outgo, d.balance, 0)))
    const range = maxValue - minValue
    const adjustedMax = maxValue + range * 0.1
    const adjustedMin = minValue - range * 0.1

    const width = 800
    const height = 300
    const padding = 50
    const barWidth = chartType === 'bar' ? (width - padding * 2) / data.length * 0.6 : 0

    const getY = (value: number) => {
      return padding + height - ((value - adjustedMin) / (adjustedMax - adjustedMin)) * height
    }

    const getX = (index: number) => {
      if (chartType === 'bar') {
        return padding + (width - padding * 2) * (index + 0.5) / data.length
      }
      return padding + (width - padding * 2) * (index / Math.max(data.length - 1, 1))
    }

    // Generate grid lines
    const gridLines = []
    const numGridLines = 5
    for (let i = 0; i <= numGridLines; i++) {
      const value = adjustedMin + (adjustedMax - adjustedMin) * (i / numGridLines)
      const y = getY(value)
      gridLines.push(`
        <line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" stroke="#e5e7eb" stroke-width="1"/>
        <text x="${padding - 10}" y="${y + 4}" text-anchor="end" font-size="10" fill="#6b7280">
          $${Math.round(value / 1000)}k
        </text>
      `)
    }

    // Generate paths for each metric
    const incomePath = `M ${data.map((d, i) => {
      const x = getX(i)
      const y = getY(d.income)
      return `${x} ${y}`
    }).join(' L ')}`

    const outgoPath = `M ${data.map((d, i) => {
      const x = getX(i)
      const y = getY(d.outgo)
      return `${x} ${y}`
    }).join(' L ')}`

    const balancePath = `M ${data.map((d, i) => {
      const x = getX(i)
      const y = getY(d.balance)
      return `${x} ${y}`
    }).join(' L ')}`

    const netPath = `M ${data.map((d, i) => {
      const x = getX(i)
      const y = getY(d.net)
      return `${x} ${y}`
    }).join(' L ')}`

    // Generate area fills
    const incomeArea = `
      M ${getX(0)} ${getY(0)}
      L ${data.map((d, i) => `${getX(i)} ${getY(d.income)}`).join(' L ')}
      L ${getX(data.length - 1)} ${getY(0)}
      Z
    `

    const outgoArea = `
      M ${getX(0)} ${getY(0)}
      L ${data.map((d, i) => `${getX(i)} ${getY(d.outgo)}`).join(' L ')}
      L ${getX(data.length - 1)} ${getY(0)}
      Z
    `

    // Generate bars for bar chart
    const bars = chartType === 'bar' ? data.map((d, i) => {
      const x = getX(i)
      const zeroY = getY(0)
      const incomeHeight = zeroY - getY(d.income)
      const outgoHeight = zeroY - getY(d.outgo)
      const singleBarWidth = barWidth / 2
      
      return `
        <rect x="${x - singleBarWidth * 1.5}" y="${getY(d.income)}" width="${singleBarWidth}" height="${incomeHeight}" 
              fill="#22c55e" opacity="0.8" rx="2">
          <title>Income ${d.month}: $${d.income.toLocaleString()}</title>
        </rect>
        <rect x="${x - singleBarWidth * 0.5}" y="${getY(d.outgo)}" width="${singleBarWidth}" height="${outgoHeight}" 
              fill="#ef4444" opacity="0.8" rx="2">
          <title>Outgo ${d.month}: $${d.outgo.toLocaleString()}</title>
        </rect>
      `
    }).join('') : ''

    const svg = `
      <svg width="100%" height="${height + padding * 2}" viewBox="0 0 ${width} ${height + padding * 2}" class="transition-all duration-500">
        <defs>
          <linearGradient id="incomeGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#22c55e;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#22c55e;stop-opacity:0.05" />
          </linearGradient>
          <linearGradient id="outgoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#ef4444;stop-opacity:0.3" />
            <stop offset="100%" style="stop-color:#ef4444;stop-opacity:0.05" />
          </linearGradient>
          <filter id="shadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" flood-opacity="0.3"/>
          </filter>
        </defs>
        
        <!-- Grid lines -->
        ${gridLines.join('')}
        
        ${chartType === 'bar' ? `
          <!-- Bar Chart -->
          ${bars}
          
          <!-- Balance line overlay -->
          <path d="${balancePath}" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#shadow)"/>
        ` : chartType === 'line' ? `
          <!-- Line Chart -->
          <path d="${incomePath}" fill="none" stroke="#22c55e" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#shadow)"/>
          <path d="${outgoPath}" fill="none" stroke="#ef4444" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#shadow)"/>
          <path d="${balancePath}" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#shadow)"/>
          <path d="${netPath}" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,5" stroke-linejoin="round" stroke-linecap="round"/>
        ` : `
          <!-- Area Chart (default) -->
          <path d="${incomeArea}" fill="url(#incomeGradient)" opacity="0.8"/>
          <path d="${outgoArea}" fill="url(#outgoGradient)" opacity="0.8"/>
          <path d="${incomePath}" fill="none" stroke="#22c55e" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#shadow)"/>
          <path d="${outgoPath}" fill="none" stroke="#ef4444" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#shadow)"/>
          <path d="${balancePath}" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" filter="url(#shadow)"/>
          <path d="${netPath}" fill="none" stroke="#3b82f6" stroke-width="2" stroke-dasharray="5,5" stroke-linejoin="round" stroke-linecap="round"/>
        `}
        
        <!-- Data points for line and area charts -->
        ${chartType !== 'bar' ? data.map((d, i) => {
          const x = getX(i)
          const yIncome = getY(d.income)
          const yOutgo = getY(d.outgo)
          const yBalance = getY(d.balance)
          const yNet = getY(d.net)
          
          return `
            <circle cx="${x}" cy="${yIncome}" r="5" fill="#22c55e" stroke="white" stroke-width="2" class="hover:r-7 transition-all cursor-pointer">
              <title>Income ${d.month}: $${d.income.toLocaleString()}</title>
            </circle>
            <circle cx="${x}" cy="${yOutgo}" r="5" fill="#ef4444" stroke="white" stroke-width="2" class="hover:r-7 transition-all cursor-pointer">
              <title>Outgo ${d.month}: $${d.outgo.toLocaleString()}</title>
            </circle>
            <circle cx="${x}" cy="${yBalance}" r="5" fill="#8b5cf6" stroke="white" stroke-width="2" class="hover:r-7 transition-all cursor-pointer">
              <title>Balance ${d.month}: $${d.balance.toLocaleString()}</title>
            </circle>
            <circle cx="${x}" cy="${yNet}" r="4" fill="#3b82f6" stroke="white" stroke-width="2" class="hover:r-6 transition-all cursor-pointer">
              <title>Net ${d.month}: $${d.net.toLocaleString()}</title>
            </circle>
          `
        }).join('') : ''}
        
        <!-- Month labels -->
        ${data.map((d, i) => {
          const x = getX(i)
          return `
            <text x="${x}" y="${height + padding + 20}" text-anchor="middle" font-size="12" fill="#6b7280">
              ${d.month}
            </text>
          `
        }).join('')}
        
        <!-- Legend -->
        <g transform="translate(${width - 180}, 20)">
          <rect x="0" y="0" width="170" height="85" fill="white" fill-opacity="0.9" stroke="#e5e7eb" rx="4"/>
          
          <circle cx="10" cy="15" r="4" fill="#22c55e"/>
          <text x="20" y="19" font-size="12" fill="#374151">Income</text>
          
          <circle cx="10" cy="35" r="4" fill="#ef4444"/>
          <text x="20" y="39" font-size="12" fill="#374151">Outgo</text>
          
          <circle cx="10" cy="55" r="4" fill="#8b5cf6"/>
          <text x="20" y="59" font-size="12" fill="#374151">Balance</text>
          
          <circle cx="10" cy="75" r="3" fill="#3b82f6"/>
          <text x="20" y="79" font-size="12" fill="#374151">Net Cashflow</text>
        </g>
        
        <!-- Title -->
        <text x="${width / 2}" y="25" text-anchor="middle" font-size="16" font-weight="bold" fill="#1f2937">
          Real-time Cashflow Forecast
        </text>
      </svg>
    `

    chartRef.current.innerHTML = svg
  }, [data, chartType])

  return (
    <div className="w-full">
      <div 
        ref={chartRef} 
        className="w-full bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 flex items-center justify-center"
        style={{ minHeight: '400px' }}
      />
      <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>Project Income</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span>Operating Costs</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
          <span>Cash Balance</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-1 bg-blue-500 rounded-full"></div>
          <span>Net Cashflow</span>
        </div>
      </div>
    </div>
  )
}
