// Performance monitoring and optimization utilities

import { metrics } from './observability'

interface PerformanceMetrics {
  timing: {
    navigationStart: number
    domContentLoaded: number
    loadComplete: number
    firstPaint: number
    firstContentfulPaint: number
    largestContentfulPaint: number
    firstInputDelay: number
    cumulativeLayoutShift: number
  }
  resources: Array<{
    name: string
    duration: number
    size: number
    type: string
  }>
  vitals: {
    lcp: number  // Largest Contentful Paint
    fid: number  // First Input Delay
    cls: number  // Cumulative Layout Shift
  }
}

// Core Web Vitals monitoring
export class WebVitalsMonitor {
  private vitals: Partial<PerformanceMetrics['vitals']> = {}
  private observers: PerformanceObserver[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers()
    }
  }

  private initializeObservers() {
    // Largest Contentful Paint (LCP)
    this.observeMetric('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1] as any
      this.vitals.lcp = lastEntry.startTime
      this.reportVital('lcp', lastEntry.startTime)
    })

    // First Input Delay (FID)
    this.observeMetric('first-input', (entries) => {
      const firstEntry = entries[0] as any
      this.vitals.fid = firstEntry.processingStart - firstEntry.startTime
      this.reportVital('fid', this.vitals.fid)
    })

    // Cumulative Layout Shift (CLS)
    let clsValue = 0
    this.observeMetric('layout-shift', (entries) => {
      for (const entry of entries as any[]) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }
      this.vitals.cls = clsValue
      this.reportVital('cls', clsValue)
    })

    // Long tasks (performance issues)
    this.observeMetric('longtask', (entries) => {
      for (const entry of entries) {
        const duration = entry.duration
        if (duration > 50) { // Tasks longer than 50ms
          this.reportVital('long-task', duration)
        }
      }
    })
  }

  private observeMetric(
    type: string, 
    callback: (entries: PerformanceEntry[]) => void
  ) {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries())
      })
      
      observer.observe({ type, buffered: true })
      this.observers.push(observer)
    } catch (error) {
      console.warn(`Could not observe ${type}:`, error)
    }
  }

  private reportVital(name: string, value: number) {
    metrics.gauge(`vitals.${name}`, value)
    
    // Log poor performance
    const thresholds = {
      lcp: 2500,   // Good: ≤2.5s
      fid: 100,    // Good: ≤100ms
      cls: 0.1,    // Good: ≤0.1
      'long-task': 100, // Poor: >100ms
    }

    if (value > (thresholds[name as keyof typeof thresholds] || Infinity)) {
      console.warn(`Poor ${name} performance:`, value)
    }
  }

  getVitals(): Partial<PerformanceMetrics['vitals']> {
    return { ...this.vitals }
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect())
  }
}

// Resource loading monitor
export class ResourceMonitor {
  private resources: PerformanceMetrics['resources'] = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeResourceObserver()
    }
  }

  private initializeResourceObserver() {
    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as PerformanceResourceTiming[]) {
        const resource = {
          name: entry.name,
          duration: entry.duration,
          size: entry.transferSize || 0,
          type: this.getResourceType(entry.name, entry.initiatorType),
        }

        this.resources.push(resource)
        
        // Report slow resources
        if (entry.duration > 1000) { // >1s
          metrics.gauge('resource.slow', entry.duration, {
            type: resource.type,
            size: String(resource.size),
          })
        }

        // Report large resources
        if (resource.size > 500000) { // >500KB
          metrics.gauge('resource.large', resource.size, {
            type: resource.type,
          })
        }
      }
    })

    observer.observe({ type: 'resource', buffered: true })
  }

  private getResourceType(url: string, initiatorType: string): string {
    if (initiatorType) return initiatorType
    
    const extension = url.split('.').pop()?.toLowerCase()
    
    const typeMap: Record<string, string> = {
      js: 'script',
      css: 'stylesheet',
      png: 'image',
      jpg: 'image',
      jpeg: 'image',
      gif: 'image',
      svg: 'image',
      woff: 'font',
      woff2: 'font',
      ttf: 'font',
    }

    return typeMap[extension || ''] || 'other'
  }

  getResources(): PerformanceMetrics['resources'] {
    return [...this.resources]
  }

  getResourceSummary(): {
    totalSize: number
    totalRequests: number
    slowResources: number
    byType: Record<string, { count: number; size: number }>
  } {
    const summary = {
      totalSize: 0,
      totalRequests: this.resources.length,
      slowResources: 0,
      byType: {} as Record<string, { count: number; size: number }>,
    }

    for (const resource of this.resources) {
      summary.totalSize += resource.size
      
      if (resource.duration > 1000) {
        summary.slowResources++
      }

      if (!summary.byType[resource.type]) {
        summary.byType[resource.type] = { count: 0, size: 0 }
      }
      
      summary.byType[resource.type].count++
      summary.byType[resource.type].size += resource.size
    }

    return summary
  }
}

// Memory monitoring
export class MemoryMonitor {
  private measurements: Array<{
    timestamp: Date
    used: number
    total: number
    percentage: number
  }> = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.startMonitoring()
    }
  }

  private startMonitoring() {
    const measure = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const measurement = {
          timestamp: new Date(),
          used: memory.usedJSHeapSize,
          total: memory.totalJSHeapSize,
          percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
        }

        this.measurements.push(measurement)
        
        // Keep only last 100 measurements
        if (this.measurements.length > 100) {
          this.measurements.shift()
        }

        // Report memory metrics
        metrics.gauge('memory.used', measurement.used)
        metrics.gauge('memory.percentage', measurement.percentage)

        // Warn about memory issues
        if (measurement.percentage > 85) {
          console.warn('High memory usage:', measurement.percentage.toFixed(1) + '%')
          metrics.increment('memory.warning')
        }
      }
    }

    // Initial measurement
    measure()
    
    // Measure every 30 seconds
    setInterval(measure, 30000)
  }

  getCurrentMemory(): { used: number; total: number; percentage: number } | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
      }
    }
    return null
  }

  getMemoryHistory(): typeof this.measurements {
    return [...this.measurements]
  }
}

// Bundle analyzer
export function analyzeBundleSize(): Promise<{
  totalSize: number
  gzippedSize: number
  modules: Array<{ name: string; size: number }>
}> {
  return new Promise((resolve) => {
    // This would integrate with webpack-bundle-analyzer or similar tools
    // For now, we'll estimate based on loaded resources
    
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
    
    let totalSize = 0
    const modules: Array<{ name: string; size: number }> = []

    // Estimate sizes (in production, you'd have actual bundle analysis)
    scripts.forEach((script: any) => {
      const size = Math.random() * 500000 + 50000 // Simulated size
      totalSize += size
      modules.push({
        name: script.src.split('/').pop() || 'unknown',
        size: Math.round(size),
      })
    })

    styles.forEach((link: any) => {
      const size = Math.random() * 100000 + 10000 // Simulated size
      totalSize += size
      modules.push({
        name: link.href.split('/').pop() || 'unknown',
        size: Math.round(size),
      })
    })

    resolve({
      totalSize: Math.round(totalSize),
      gzippedSize: Math.round(totalSize * 0.3), // Estimate 30% compression
      modules: modules.sort((a, b) => b.size - a.size),
    })
  })
}

// Performance optimization helpers
export function preloadCriticalResources(resources: string[]) {
  if (typeof document === 'undefined') return

  resources.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url
    
    // Determine resource type
    if (url.endsWith('.js')) {
      link.as = 'script'
    } else if (url.endsWith('.css')) {
      link.as = 'style'
    } else if (url.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
      link.as = 'image'
    } else if (url.match(/\.(woff|woff2|ttf)$/)) {
      link.as = 'font'
      link.crossOrigin = 'anonymous'
    }

    document.head.appendChild(link)
  })
}

export function prefetchNextPageResources(urls: string[]) {
  if (typeof document === 'undefined') return

  urls.forEach(url => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
  })
}

// Lazy loading utilities
export function createIntersectionObserver(
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver | null {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return null
  }

  return new IntersectionObserver(callback, {
    rootMargin: '50px',
    threshold: 0.1,
    ...options,
  })
}

// Performance budget checker
export function checkPerformanceBudget(budget: {
  totalSize?: number
  scriptSize?: number
  styleSize?: number
  imageSize?: number
  fontSize?: number
  requests?: number
  loadTime?: number
}): {
  passed: boolean
  violations: Array<{ metric: string; actual: number; budget: number }>
} {
  const violations: Array<{ metric: string; actual: number; budget: number }> = []
  
  // Get current performance data
  const resourceSummary = new ResourceMonitor().getResourceSummary()
  const loadTime = performance.timing.loadEventEnd - performance.timing.navigationStart

  // Check budgets
  if (budget.totalSize && resourceSummary.totalSize > budget.totalSize) {
    violations.push({
      metric: 'totalSize',
      actual: resourceSummary.totalSize,
      budget: budget.totalSize,
    })
  }

  if (budget.requests && resourceSummary.totalRequests > budget.requests) {
    violations.push({
      metric: 'requests',
      actual: resourceSummary.totalRequests,
      budget: budget.requests,
    })
  }

  if (budget.loadTime && loadTime > budget.loadTime) {
    violations.push({
      metric: 'loadTime',
      actual: loadTime,
      budget: budget.loadTime,
    })
  }

  // Check by resource type
  Object.entries(budget).forEach(([key, budgetValue]) => {
    if (key.endsWith('Size') && key !== 'totalSize') {
      const resourceType = key.replace('Size', '')
      const actual = resourceSummary.byType[resourceType]?.size || 0
      
      if (actual > budgetValue) {
        violations.push({
          metric: key,
          actual,
          budget: budgetValue,
        })
      }
    }
  })

  return {
    passed: violations.length === 0,
    violations,
  }
}

// Export monitors
export const webVitalsMonitor = new WebVitalsMonitor()
export const resourceMonitor = new ResourceMonitor()
export const memoryMonitor = new MemoryMonitor()

// Performance summary function
export function getPerformanceSummary(): {
  vitals: Partial<PerformanceMetrics['vitals']>
  resources: ReturnType<ResourceMonitor['getResourceSummary']>
  memory: ReturnType<MemoryMonitor['getCurrentMemory']>
  timing: {
    domContentLoaded: number
    loadComplete: number
    totalLoadTime: number
  }
} {
  const timing = performance.timing
  
  return {
    vitals: webVitalsMonitor.getVitals(),
    resources: resourceMonitor.getResourceSummary(),
    memory: memoryMonitor.getCurrentMemory(),
    timing: {
      domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
      loadComplete: timing.loadEventEnd - timing.navigationStart,
      totalLoadTime: timing.loadEventEnd - timing.fetchStart,
    },
  }
}
