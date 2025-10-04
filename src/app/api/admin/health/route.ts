import { NextRequest, NextResponse } from 'next/server'
import { getSystemHealth, logger, metrics, errorTracker, rateLimitMonitor } from '@/lib/observability'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const component = url.searchParams.get('component')
    const since = url.searchParams.get('since')
    
    const sinceDate = since ? new Date(since) : new Date(Date.now() - 3600000) // Last hour by default

    if (component === 'logs') {
      const logs = logger.getLogs({
        since: sinceDate,
        limit: 1000,
      })
      
      return NextResponse.json({
        logs,
        count: logs.length,
        since: sinceDate.toISOString(),
      })
    }

    if (component === 'metrics') {
      const allMetrics = metrics.getMetrics(undefined, sinceDate)
      
      // Group metrics by name for easier consumption
      const groupedMetrics: Record<string, any> = {}
      
      for (const metric of allMetrics) {
        if (!groupedMetrics[metric.name]) {
          groupedMetrics[metric.name] = {
            name: metric.name,
            values: [],
            stats: metrics.getStats(metric.name),
          }
        }
        groupedMetrics[metric.name].values.push({
          value: metric.value,
          timestamp: metric.timestamp,
          tags: metric.tags,
        })
      }

      return NextResponse.json({
        metrics: Object.values(groupedMetrics),
        count: allMetrics.length,
        since: sinceDate.toISOString(),
      })
    }

    if (component === 'errors') {
      const errors = errorTracker.getErrors({
        since: sinceDate,
        limit: 500,
      })
      
      // Group errors by component and operation
      const errorSummary: Record<string, { count: number; lastOccurrence: Date; examples: any[] }> = {}
      
      for (const error of errors) {
        const key = `${error.component || 'unknown'}:${error.operation || 'unknown'}`
        
        if (!errorSummary[key]) {
          errorSummary[key] = {
            count: 0,
            lastOccurrence: error.timestamp,
            examples: [],
          }
        }
        
        errorSummary[key].count++
        if (error.timestamp > errorSummary[key].lastOccurrence) {
          errorSummary[key].lastOccurrence = error.timestamp
        }
        
        if (errorSummary[key].examples.length < 3) {
          errorSummary[key].examples.push({
            message: error.message,
            timestamp: error.timestamp,
            stack: error.stack?.split('\n').slice(0, 5).join('\n'), // Truncated stack
          })
        }
      }

      return NextResponse.json({
        errors,
        summary: errorSummary,
        count: errors.length,
        since: sinceDate.toISOString(),
      })
    }

    if (component === 'rate-limits') {
      const alerts = rateLimitMonitor.getAlerts(sinceDate)
      const stats = rateLimitMonitor.getRateStats()
      
      return NextResponse.json({
        alerts,
        stats,
        alertCount: alerts.length,
        since: sinceDate.toISOString(),
      })
    }

    // Default: return overall health
    const health = await getSystemHealth()
    
    return NextResponse.json(health)

  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      { 
        error: 'Health check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// Simple health check endpoint for load balancers
export async function HEAD() {
  try {
    const health = await getSystemHealth()
    
    if (health.status === 'healthy') {
      return new NextResponse(null, { status: 200 })
    } else if (health.status === 'degraded') {
      return new NextResponse(null, { status: 200 }) // Still serve traffic but log concern
    } else {
      return new NextResponse(null, { status: 503 }) // Service unavailable
    }
  } catch (error) {
    return new NextResponse(null, { status: 503 })
  }
}
