// Security utilities for production hardening

import { NextRequest } from 'next/server'
import { logger, rateLimitMonitor } from './observability'

interface SecurityConfig {
  enableCSP: boolean
  enableRateLimit: boolean
  enableSQLInjectionProtection: boolean
  enableXSSProtection: boolean
  enableInputSanitization: boolean
  trustedDomains: string[]
  maxRequestSize: number // in bytes
}

const defaultConfig: SecurityConfig = {
  enableCSP: true,
  enableRateLimit: true,
  enableSQLInjectionProtection: true,
  enableXSSProtection: true,
  enableInputSanitization: true,
  trustedDomains: ['localhost', 'builder-forecast.com'],
  maxRequestSize: 10 * 1024 * 1024, // 10MB
}

// Content Security Policy
export function getCSPHeaders(): Record<string, string> {
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https:",
    "connect-src 'self' https://api.xero.com https://login.xero.com",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; ')

  return {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  }
}

// SQL Injection Protection
export function sanitizeSQL(input: string): string {
  if (typeof input !== 'string') return input

  // Remove or escape dangerous SQL patterns
  const dangerous = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/gi,
    /([';]|--|\*|\/\*|\*\/)/g,
    /(0x[0-9A-F]+)/gi,
  ]

  let sanitized = input
  for (const pattern of dangerous) {
    sanitized = sanitized.replace(pattern, '')
  }

  return sanitized.trim()
}

// XSS Protection
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') return input

  // Basic HTML entity encoding
  const entityMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  }

  return input.replace(/[&<>"'`=\/]/g, (char) => entityMap[char] || char)
}

// Input validation and sanitization
export function validateAndSanitizeInput(
  input: any,
  type: 'string' | 'number' | 'email' | 'url' | 'json' | 'sql',
  maxLength = 1000
): { isValid: boolean; sanitized: any; errors: string[] } {
  const errors: string[] = []
  let sanitized = input

  // Basic type validation
  if (type === 'string' && typeof input !== 'string') {
    errors.push('Input must be a string')
    return { isValid: false, sanitized: '', errors }
  }

  if (type === 'number' && typeof input !== 'number' && isNaN(Number(input))) {
    errors.push('Input must be a number')
    return { isValid: false, sanitized: 0, errors }
  }

  // Length validation
  if (typeof input === 'string' && input.length > maxLength) {
    errors.push(`Input exceeds maximum length of ${maxLength}`)
    sanitized = input.substring(0, maxLength)
  }

  // Type-specific sanitization
  switch (type) {
    case 'string':
      sanitized = sanitizeHTML(input)
      break

    case 'email':
      if (typeof input === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(input)) {
          errors.push('Invalid email format')
        }
        sanitized = sanitizeHTML(input.toLowerCase().trim())
      }
      break

    case 'url':
      if (typeof input === 'string') {
        try {
          const url = new URL(input)
          if (!['http:', 'https:'].includes(url.protocol)) {
            errors.push('URL must use HTTP or HTTPS protocol')
          }
          sanitized = url.toString()
        } catch (error) {
          errors.push('Invalid URL format')
        }
      }
      break

    case 'json':
      if (typeof input === 'string') {
        try {
          sanitized = JSON.parse(input)
        } catch (error) {
          errors.push('Invalid JSON format')
        }
      }
      break

    case 'sql':
      if (typeof input === 'string') {
        sanitized = sanitizeSQL(input)
      }
      break

    case 'number':
      sanitized = Number(input)
      if (isNaN(sanitized)) {
        errors.push('Invalid number')
        sanitized = 0
      }
      break
  }

  return {
    isValid: errors.length === 0,
    sanitized,
    errors,
  }
}

// Request validation middleware
export async function validateRequest(
  request: NextRequest,
  config: Partial<SecurityConfig> = {}
): Promise<{
  isValid: boolean
  errors: string[]
  clientIP: string
  userAgent: string
}> {
  const errors: string[] = []
  const finalConfig = { ...defaultConfig, ...config }

  // Get client info
  const clientIP = request.ip || 
    request.headers.get('x-forwarded-for')?.split(',')[0] || 
    request.headers.get('x-real-ip') || 
    'unknown'
  
  const userAgent = request.headers.get('user-agent') || 'unknown'

  // Rate limiting
  if (finalConfig.enableRateLimit) {
    const endpoint = new URL(request.url).pathname
    const isLimited = rateLimitMonitor.isRateLimited(endpoint, clientIP)
    
    if (isLimited) {
      errors.push('Rate limit exceeded')
      logger.warn('Rate limit exceeded', { clientIP, userAgent, endpoint })
    } else {
      rateLimitMonitor.trackRequest(endpoint, clientIP)
    }
  }

  // Request size validation
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength) > finalConfig.maxRequestSize) {
    errors.push(`Request size exceeds limit of ${finalConfig.maxRequestSize} bytes`)
  }

  // Origin validation for POST requests
  if (request.method === 'POST') {
    const origin = request.headers.get('origin')
    const referer = request.headers.get('referer')
    const host = request.headers.get('host')

    if (origin && host) {
      const originHost = new URL(origin).host
      if (originHost !== host && !finalConfig.trustedDomains.includes(originHost)) {
        errors.push('Invalid origin')
        logger.warn('Suspicious origin detected', { origin, host, clientIP })
      }
    }
  }

  // User-Agent validation (basic bot detection)
  if (userAgent === 'unknown' || userAgent.length > 500) {
    errors.push('Invalid or suspicious user agent')
  }

  // Suspicious patterns in URL
  const url = request.url
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempt
    /union.*select/i,  // SQL injection
    /exec.*\(/i,  // Code execution
  ]

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(url)) {
      errors.push('Suspicious URL pattern detected')
      logger.warn('Suspicious URL pattern', { url, pattern: pattern.toString(), clientIP })
      break
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    clientIP,
    userAgent,
  }
}

// Authentication helpers
export function validateJWT(token: string): { isValid: boolean; payload?: any; error?: string } {
  try {
    // In production, use a proper JWT library like jsonwebtoken
    // This is a simplified version
    const parts = token.split('.')
    
    if (parts.length !== 3) {
      return { isValid: false, error: 'Invalid JWT format' }
    }

    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    
    // Check expiration
    if (payload.exp && Date.now() >= payload.exp * 1000) {
      return { isValid: false, error: 'Token expired' }
    }

    return { isValid: true, payload }
  } catch (error) {
    return { isValid: false, error: 'Invalid token' }
  }
}

// Password strength validation
export function validatePasswordStrength(password: string): {
  isStrong: boolean
  score: number
  feedback: string[]
} {
  const feedback: string[] = []
  let score = 0

  if (password.length >= 8) score += 1
  else feedback.push('Password should be at least 8 characters')

  if (password.length >= 12) score += 1
  else feedback.push('Consider using 12+ characters for better security')

  if (/[a-z]/.test(password)) score += 1
  else feedback.push('Include lowercase letters')

  if (/[A-Z]/.test(password)) score += 1
  else feedback.push('Include uppercase letters')

  if (/\d/.test(password)) score += 1
  else feedback.push('Include numbers')

  if (/[^a-zA-Z\d]/.test(password)) score += 1
  else feedback.push('Include special characters')

  if (!/(.)\1{2,}/.test(password)) score += 1
  else feedback.push('Avoid repeating characters')

  const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'welcome']
  if (!commonPasswords.some(common => password.toLowerCase().includes(common))) {
    score += 1
  } else {
    feedback.push('Avoid common passwords')
  }

  return {
    isStrong: score >= 6,
    score,
    feedback: feedback.length > 0 ? feedback : ['Password strength is good'],
  }
}

// Audit logging
export function auditLog(
  action: string,
  userId?: string,
  organizationId?: string,
  details?: Record<string, any>,
  clientIP?: string
) {
  logger.info(`AUDIT: ${action}`, {
    audit: true,
    action,
    userId,
    organizationId,
    details,
    clientIP,
    timestamp: new Date().toISOString(),
  })
}

// Export security configuration
export { SecurityConfig, defaultConfig }

// Security headers middleware factory
export function createSecurityHeaders(config: Partial<SecurityConfig> = {}) {
  const finalConfig = { ...defaultConfig, ...config }

  return function getSecurityHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}

    if (finalConfig.enableCSP) {
      Object.assign(headers, getCSPHeaders())
    }

    // Additional security headers
    headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    headers['X-Robots-Tag'] = 'noindex, nofollow' // Prevent indexing of admin areas

    return headers
  }
}
