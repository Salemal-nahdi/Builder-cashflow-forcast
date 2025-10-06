// Observability: Logging, Metrics, Error Tracking, Rate Limit Monitoring

interface LogLevel {
  ERROR: 'error'
  WARN: 'warn'
  INFO: 'info'
  DEBUG: 'debug'
}

interface LogEntry {
  timestamp: Date
  level: keyof LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
  organizationId?: string
  requestId?: string
  duration?: number
  error?: Error
}

interface MetricEntry {
  name: string
  value: number
  tags?: Record<string, string>
  timestamp: Date
}

interface ErrorEntry extends LogEntry {
  level: 'ERROR'
  error: Error
  stack?: string
  component?: string
  operation?: string
}

class Logger {
  private logLevel: keyof LogLevel = 'INFO'
  private logs: LogEntry[] = []
  private maxLogs = 10000

  constructor() {
    // Set log level from environment
    const envLevel = process.env.LOG_LEVEL?.toLowerCase()
    if (envLevel && ['error', 'warn', 'info', 'debug'].includes(envLevel)) {
      this.logLevel = envLevel as keyof LogLevel
    }
  }

  private shouldLog(level: keyof LogLevel): boolean {
    const levels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 }
    return levels[level] <= levels[this.logLevel]
  }

  private addLog(entry: LogEntry) {
    if (!this.shouldLog(entry.level)) return

    this.logs.push(entry)
    
    // Keep logs within limit
    if (this.logs.length > this.maxLogs) {
      this.logs.splice(0, this.logs.length - this.maxLogs)
    }

    // Output to console in development
    if (process.env.NODE_ENV === 'development') {
      const logData = {
        ...entry,
        timestamp: entry.timestamp.toISOString(),
      }
      
      switch (entry.level) {
        case 'ERROR':
          console.error('🔴', JSON.stringify(logData, null, 2))
          break
        case 'WARN':
          console.warn('🟡', JSON.stringify(logData, null, 2))
          break
        case 'INFO':
          console.info('🔵', JSON.stringify(logData, null, 2))
          break
        case 'DEBUG':
          console.debug('⚪', JSON.stringify(logData, null, 2))
          break
      }
    }

    // In production, you would send to logging service (Datadog, CloudWatch, etc.)
    this.sendToLoggingService(entry)
  }

  private async sendToLoggingService(entry: LogEntry) {
    // Placeholder for external logging service integration
    // Examples: Datadog, CloudWatch, LogRocket, Sentry
    if (process.env.NODE_ENV === 'production') {
      try {
        // await fetch(`${process.env.LOGGING_ENDPOINT}/logs`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(entry)
        // })
      } catch (error) {
        console.error('Failed to send log to service:', error)
      }
    }
  }

  error(message: string, context?: Record<string, any>, error?: Error) {
    this.addLog({
      timestamp: new Date(),
      level: 'ERROR',
      message,
      context,
      error,
    })
  }

  warn(message: string, context?: Record<string, any>) {
    this.addLog({
      timestamp: new Date(),
      level: 'WARN',
      message,
      context,
    })
  }

  info(message: string, context?: Record<string, any>) {
    this.addLog({
      timestamp: new Date(),
      level: 'INFO',
      message,
      context,
    })
  }

  debug(message: string, context?: Record<string, any>) {
    this.addLog({
      timestamp: new Date(),
      level: 'DEBUG',
      message,
      context,
    })
  }

  // Request logging with timing
  async logRequest<T>(
    operation: string,
    fn: () => Promise<T>,
    context?: Record<string, any>
  ): Promise<T> {
    const startTime = Date.now()
    const requestId = Math.random().toString(36).substring(7)
    
    this.info(`Starting ${operation}`, { ...context, requestId })
    
    try {
      const result = await fn()
      const duration = Date.now() - startTime
      
      this.info(`Completed ${operation}`, { 
        ...context, 
        requestId, 
        duration,
        success: true 
      })
      
      return result
    } catch (error) {
      const duration = Date.now() - startTime
      
      this.error(`Failed ${operation}`, { 
        ...context, 
        requestId, 
        duration,
        success: false 
      }, error as Error)
      
      throw error
    }
  }

  getLogs(filters?: {
    level?: keyof LogLevel
    organizationId?: string
    userId?: string
    since?: Date
    limit?: number
  }): LogEntry[] {
    let filteredLogs = [...this.logs]

    if (filters?.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level)
    }

    if (filters?.organizationId) {
      filteredLogs = filteredLogs.filter(log => log.organizationId === filters.organizationId)
    }

    if (filters?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId)
    }

    if (filters?.since) {
      filteredLogs = filteredLogs.filter(log => log.timestamp >= filters.since!)
    }

    if (filters?.limit) {
      filteredLogs = filteredLogs.slice(-filters.limit)
    }

    return filteredLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }
}

class MetricsCollector {
  private metrics: MetricEntry[] = []
  private counters: Map<string, number> = new Map()
  private histograms: Map<string, number[]> = new Map()

  increment(name: string, tags?: Record<string, string | undefined>) {
    // Filter out undefined values from tags
    const cleanTags = tags ? Object.fromEntries(
      Object.entries(tags).filter(([_, v]) => v !== undefined)
    ) as Record<string, string> : undefined
    
    const key = this.getMetricKey(name, cleanTags)
    this.counters.set(key, (this.counters.get(key) || 0) + 1)
    
    this.addMetric({
      name,
      value: this.counters.get(key)!,
      tags: cleanTags,
      timestamp: new Date(),
    })
  }

  gauge(name: string, value: number, tags?: Record<string, string | undefined>) {
    // Filter out undefined values from tags
    const cleanTags = tags ? Object.fromEntries(
      Object.entries(tags).filter(([_, v]) => v !== undefined)
    ) as Record<string, string> : undefined
    
    this.addMetric({
      name,
      value,
      tags: cleanTags,
      timestamp: new Date(),
    })
  }

  histogram(name: string, value: number, tags?: Record<string, string | undefined>) {
    // Filter out undefined values from tags
    const cleanTags = tags ? Object.fromEntries(
      Object.entries(tags).filter(([_, v]) => v !== undefined)
    ) as Record<string, string> : undefined
    
    const key = this.getMetricKey(name, cleanTags)
    
    if (!this.histograms.has(key)) {
      this.histograms.set(key, [])
    }
    
    this.histograms.get(key)!.push(value)
    
    this.addMetric({
      name: `${name}.histogram`,
      value,
      tags: cleanTags,
      timestamp: new Date(),
    })
  }

  private getMetricKey(name: string, tags?: Record<string, string>): string {
    const tagString = tags ? Object.entries(tags).map(([k, v]) => `${k}:${v}`).join(',') : ''
    return `${name}[${tagString}]`
  }

  private addMetric(metric: MetricEntry) {
    this.metrics.push(metric)
    
    // Keep metrics within limit
    if (this.metrics.length > 50000) {
      this.metrics.splice(0, this.metrics.length - 50000)
    }

    // Send to metrics service in production
    this.sendToMetricsService(metric)
  }

  private async sendToMetricsService(metric: MetricEntry) {
    // Placeholder for metrics service integration
    // Examples: Datadog, CloudWatch, Prometheus, New Relic
    if (process.env.NODE_ENV === 'production') {
      try {
        // await fetch(`${process.env.METRICS_ENDPOINT}/metrics`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(metric)
        // })
      } catch (error) {
        console.error('Failed to send metric to service:', error)
      }
    }
  }

  getMetrics(name?: string, since?: Date): MetricEntry[] {
    let filtered = [...this.metrics]

    if (name) {
      filtered = filtered.filter(m => m.name.includes(name))
    }

    if (since) {
      filtered = filtered.filter(m => m.timestamp >= since)
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }

  getStats(name: string): {
    count: number
    sum: number
    avg: number
    min: number
    max: number
  } {
    const values = this.metrics
      .filter(m => m.name === name)
      .map(m => m.value)

    if (values.length === 0) {
      return { count: 0, sum: 0, avg: 0, min: 0, max: 0 }
    }

    return {
      count: values.length,
      sum: values.reduce((a, b) => a + b, 0),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values),
      max: Math.max(...values),
    }
  }
}

class ErrorTracker {
  private errors: ErrorEntry[] = []

  captureError(error: Error, context?: {
    component?: string
    operation?: string
    userId?: string
    organizationId?: string
    requestId?: string
    extra?: Record<string, any>
  }) {
    const errorEntry: ErrorEntry = {
      timestamp: new Date(),
      level: 'ERROR',
      message: error.message,
      error,
      stack: error.stack,
      context: context?.extra,
      userId: context?.userId,
      organizationId: context?.organizationId,
      requestId: context?.requestId,
      component: context?.component,
      operation: context?.operation,
    }

    this.errors.push(errorEntry)

    // Keep errors within limit
    if (this.errors.length > 5000) {
      this.errors.splice(0, this.errors.length - 5000)
    }

    // Send to error tracking service
    this.sendToErrorService(errorEntry)

    // Also log the error
    logger.error(error.message, context?.extra, error)
  }

  private async sendToErrorService(errorEntry: ErrorEntry) {
    // Placeholder for error tracking service integration
    // Examples: Sentry, Bugsnag, Rollbar
    if (process.env.NODE_ENV === 'production') {
      try {
        // await fetch(`${process.env.ERROR_TRACKING_ENDPOINT}/errors`, {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(errorEntry)
        // })
      } catch (error) {
        console.error('Failed to send error to tracking service:', error)
      }
    }
  }

  getErrors(filters?: {
    component?: string
    operation?: string
    organizationId?: string
    since?: Date
    limit?: number
  }): ErrorEntry[] {
    let filtered = [...this.errors]

    if (filters?.component) {
      filtered = filtered.filter(e => e.component === filters.component)
    }

    if (filters?.operation) {
      filtered = filtered.filter(e => e.operation === filters.operation)
    }

    if (filters?.organizationId) {
      filtered = filtered.filter(e => e.organizationId === filters.organizationId)
    }

    if (filters?.since) {
      filtered = filtered.filter(e => e.timestamp >= filters.since!)
    }

    if (filters?.limit) {
      filtered = filtered.slice(-filters.limit)
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  }
}

class RateLimitMonitor {
  private requests: Map<string, { count: number; resetTime: number }> = new Map()
  private alerts: Array<{ endpoint: string, timestamp: Date, rate: number }> = []

  trackRequest(endpoint: string, identifier: string = 'global') {
    const key = `${endpoint}:${identifier}`
    const now = Date.now()
    const windowMs = 60000 // 1 minute window
    
    const current = this.requests.get(key) || { count: 0, resetTime: now + windowMs }
    
    if (now > current.resetTime) {
      // Reset window
      current.count = 1
      current.resetTime = now + windowMs
    } else {
      current.count++
    }
    
    this.requests.set(key, current)
    
    // Track metric
    metrics.increment('api.requests', { endpoint, identifier })
    
    // Check for rate limit alerts
    this.checkRateLimit(endpoint, identifier, current.count)
    
    return current
  }

  private checkRateLimit(endpoint: string, identifier: string, count: number) {
    const limits: Record<string, number> = {
      '/api/xero': 100,      // Xero API has strict limits
      '/api/sync': 10,       // Sync operations should be limited
      '/api/reports': 20,    // Report generation is expensive
      'default': 200,        // Default limit for other endpoints
    }

    const limit = limits[endpoint] || limits['default']
    
    if (count >= limit * 0.8) { // Alert at 80% of limit
      this.alerts.push({
        endpoint,
        timestamp: new Date(),
        rate: count,
      })

      logger.warn('Rate limit approaching', {
        endpoint,
        identifier,
        currentRate: count,
        limit,
        threshold: '80%'
      })

      metrics.increment('rate_limit.warnings', { endpoint })
    }

    if (count >= limit) {
      logger.error('Rate limit exceeded', {
        endpoint,
        identifier,
        currentRate: count,
        limit
      })

      metrics.increment('rate_limit.exceeded', { endpoint })
    }
  }

  isRateLimited(endpoint: string, identifier: string = 'global'): boolean {
    const key = `${endpoint}:${identifier}`
    const current = this.requests.get(key)
    
    if (!current) return false
    
    const limits: Record<string, number> = {
      '/api/xero': 100,
      '/api/sync': 10,
      '/api/reports': 20,
      'default': 200,
    }

    const limit = limits[endpoint] || limits['default']
    return current.count >= limit
  }

  getAlerts(since?: Date): typeof this.alerts {
    if (!since) return [...this.alerts]
    
    return this.alerts.filter(alert => alert.timestamp >= since)
  }

  getRateStats(): Record<string, { current: number; limit: number; remaining: number }> {
    const stats: Record<string, { current: number; limit: number; remaining: number }> = {}
    
    for (const [key, data] of Array.from(this.requests.entries())) {
      const [endpoint] = key.split(':')
      
      const limits: Record<string, number> = {
        '/api/xero': 100,
        '/api/sync': 10,
        '/api/reports': 20,
        'default': 200,
      }
      
      const limit = limits[endpoint] || limits['default']
      
      stats[endpoint] = {
        current: data.count,
        limit,
        remaining: Math.max(0, limit - data.count),
      }
    }
    
    return stats
  }
}

// Performance monitoring wrapper
function withPerformanceMonitoring<T extends (...args: any[]) => any>(
  fn: T,
  name: string,
  component?: string
): T {
  return ((...args: any[]) => {
    const startTime = Date.now()
    
    try {
      const result = fn(...args)
      
      // Handle both sync and async functions
      if (result instanceof Promise) {
        return result
          .then((value) => {
            const duration = Date.now() - startTime
            metrics.histogram('function.duration', duration, { name, component })
            metrics.increment('function.success', { name, component })
            return value
          })
          .catch((error) => {
            const duration = Date.now() - startTime
            metrics.histogram('function.duration', duration, { name, component })
            metrics.increment('function.error', { name, component })
            errorTracker.captureError(error, { component, operation: name })
            throw error
          })
      } else {
        const duration = Date.now() - startTime
        metrics.histogram('function.duration', duration, { name, component })
        metrics.increment('function.success', { name, component })
        return result
      }
    } catch (error) {
      const duration = Date.now() - startTime
      metrics.histogram('function.duration', duration, { name, component })
      metrics.increment('function.error', { name, component })
      errorTracker.captureError(error as Error, { component, operation: name })
      throw error
    }
  }) as T
}

// Export instances
export const logger = new Logger()
export const metrics = new MetricsCollector()
export const errorTracker = new ErrorTracker()
export const rateLimitMonitor = new RateLimitMonitor()
export { withPerformanceMonitoring }

// Health check function
export async function getSystemHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: Date
  services: Record<string, { status: 'up' | 'down'; latency?: number }>
  metrics: {
    errorRate: number
    avgResponseTime: number
    rateLimitHits: number
  }
}> {
  const now = new Date()
  const oneMinuteAgo = new Date(now.getTime() - 60000)
  
  // Check recent errors
  const recentErrors = errorTracker.getErrors({ since: oneMinuteAgo })
  const recentRequests = metrics.getMetrics('api.requests', oneMinuteAgo)
  const recentDurations = metrics.getMetrics('function.duration', oneMinuteAgo)
  const rateLimitAlerts = rateLimitMonitor.getAlerts(oneMinuteAgo)
  
  const errorRate = recentRequests.length > 0 ? recentErrors.length / recentRequests.length : 0
  const avgResponseTime = recentDurations.length > 0 
    ? recentDurations.reduce((sum, m) => sum + m.value, 0) / recentDurations.length 
    : 0

  let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy'
  
  if (errorRate > 0.1 || avgResponseTime > 5000 || rateLimitAlerts.length > 10) {
    status = 'unhealthy'
  } else if (errorRate > 0.05 || avgResponseTime > 2000 || rateLimitAlerts.length > 5) {
    status = 'degraded'
  }

  return {
    status,
    timestamp: now,
    services: {
      database: { status: 'up' }, // Would check actual DB connectivity
      xero: { status: 'up' },     // Would check Xero API status
      email: { status: 'up' },    // Would check email service
    },
    metrics: {
      errorRate,
      avgResponseTime,
      rateLimitHits: rateLimitAlerts.length,
    }
  }
}
