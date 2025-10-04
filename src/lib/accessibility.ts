// Accessibility utilities and helpers for WCAG 2.1 AA compliance

interface AccessibilityConfig {
  announcePageChanges: boolean
  enableKeyboardNavigation: boolean
  enableHighContrast: boolean
  enableReducedMotion: boolean
  enableFocusManagement: boolean
}

// ARIA live region management
export class ARIALiveRegion {
  private region: HTMLElement | null = null
  private timeout: NodeJS.Timeout | null = null

  constructor(private politeness: 'polite' | 'assertive' = 'polite') {
    if (typeof window !== 'undefined') {
      this.initializeRegion()
    }
  }

  private initializeRegion() {
    this.region = document.createElement('div')
    this.region.setAttribute('aria-live', this.politeness)
    this.region.setAttribute('aria-atomic', 'true')
    this.region.className = 'sr-only' // Screen reader only
    this.region.style.cssText = `
      position: absolute;
      left: -10000px;
      width: 1px;
      height: 1px;
      overflow: hidden;
    `
    document.body.appendChild(this.region)
  }

  announce(message: string, delay = 100) {
    if (!this.region) return

    // Clear any existing timeout
    if (this.timeout) {
      clearTimeout(this.timeout)
    }

    // Delay to ensure screen readers pick up the change
    this.timeout = setTimeout(() => {
      if (this.region) {
        this.region.textContent = message
        
        // Clear after announcement to allow repeat announcements
        setTimeout(() => {
          if (this.region) {
            this.region.textContent = ''
          }
        }, 1000)
      }
    }, delay)
  }

  destroy() {
    if (this.timeout) {
      clearTimeout(this.timeout)
    }
    if (this.region && this.region.parentNode) {
      this.region.parentNode.removeChild(this.region)
    }
  }
}

// Focus management
export class FocusManager {
  private previousFocus: HTMLElement | null = null
  private trapStack: HTMLElement[] = []

  // Save current focus and set new focus
  setFocus(element: HTMLElement | string, savePrevious = true) {
    if (typeof window === 'undefined') return

    if (savePrevious) {
      this.previousFocus = document.activeElement as HTMLElement
    }

    const targetElement = typeof element === 'string' 
      ? document.querySelector(element) as HTMLElement
      : element

    if (targetElement) {
      targetElement.focus()
      
      // Scroll element into view if needed
      targetElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'nearest'
      })
    }
  }

  // Restore previously saved focus
  restoreFocus() {
    if (this.previousFocus && document.contains(this.previousFocus)) {
      this.previousFocus.focus()
      this.previousFocus = null
    }
  }

  // Trap focus within a container (for modals, dropdowns)
  trapFocus(container: HTMLElement) {
    this.trapStack.push(container)
    
    const focusableElements = this.getFocusableElements(container)
    if (focusableElements.length === 0) return

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault()
          lastElement.focus()
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault()
          firstElement.focus()
        }
      }
    }

    container.addEventListener('keydown', handleKeyDown)
    
    // Store cleanup function
    ;(container as any).__focusTrapCleanup = () => {
      container.removeEventListener('keydown', handleKeyDown)
    }

    // Focus first element
    firstElement.focus()
  }

  // Release focus trap
  releaseFocusTrap() {
    const container = this.trapStack.pop()
    if (container && (container as any).__focusTrapCleanup) {
      ;(container as any).__focusTrapCleanup()
      delete (container as any).__focusTrapCleanup
    }
  }

  // Get all focusable elements within a container
  private getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ].join(', ')

    return Array.from(container.querySelectorAll(focusableSelectors))
      .filter(el => {
        const element = el as HTMLElement
        return element.offsetWidth > 0 && 
               element.offsetHeight > 0 && 
               !element.hidden &&
               window.getComputedStyle(element).visibility !== 'hidden'
      }) as HTMLElement[]
  }
}

// Keyboard navigation helpers
export class KeyboardNavigation {
  private handlers: Map<string, (e: KeyboardEvent) => void> = new Map()

  // Add keyboard shortcut
  addShortcut(
    keys: string,
    handler: (e: KeyboardEvent) => void,
    description?: string
  ) {
    const normalizedKeys = this.normalizeKeys(keys)
    this.handlers.set(normalizedKeys, handler)

    // Store description for help systems
    if (description) {
      ;(handler as any).__description = description
    }
  }

  // Remove keyboard shortcut
  removeShortcut(keys: string) {
    const normalizedKeys = this.normalizeKeys(keys)
    this.handlers.delete(normalizedKeys)
  }

  // Handle keydown events
  handleKeyDown(e: KeyboardEvent) {
    const currentKeys = this.getCurrentKeys(e)
    const handler = this.handlers.get(currentKeys)

    if (handler) {
      e.preventDefault()
      handler(e)
    }
  }

  // Get all registered shortcuts with descriptions
  getShortcuts(): Array<{ keys: string; description: string }> {
    return Array.from(this.handlers.entries()).map(([keys, handler]) => ({
      keys: this.denormalizeKeys(keys),
      description: (handler as any).__description || 'No description'
    }))
  }

  private normalizeKeys(keys: string): string {
    return keys.toLowerCase()
      .replace(/\+/g, '+')
      .split('+')
      .sort()
      .join('+')
  }

  private denormalizeKeys(keys: string): string {
    return keys.split('+')
      .map(key => key.charAt(0).toUpperCase() + key.slice(1))
      .join(' + ')
  }

  private getCurrentKeys(e: KeyboardEvent): string {
    const keys: string[] = []
    
    if (e.ctrlKey || e.metaKey) keys.push('ctrl')
    if (e.altKey) keys.push('alt')
    if (e.shiftKey) keys.push('shift')
    
    // Don't include modifier keys as the main key
    if (!['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      keys.push(e.key.toLowerCase())
    }

    return keys.sort().join('+')
  }
}

// Color contrast utilities
export function checkColorContrast(
  foreground: string,
  background: string
): { ratio: number; wcagLevel: 'AAA' | 'AA' | 'fail' } {
  const fgLuminance = getLuminance(foreground)
  const bgLuminance = getLuminance(background)
  
  const ratio = (Math.max(fgLuminance, bgLuminance) + 0.05) / 
                (Math.min(fgLuminance, bgLuminance) + 0.05)

  let wcagLevel: 'AAA' | 'AA' | 'fail'
  if (ratio >= 7) wcagLevel = 'AAA'
  else if (ratio >= 4.5) wcagLevel = 'AA'
  else wcagLevel = 'fail'

  return { ratio, wcagLevel }
}

function getLuminance(color: string): number {
  // Convert hex to RGB
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16) / 255
  const g = parseInt(hex.substr(2, 2), 16) / 255
  const b = parseInt(hex.substr(4, 2), 16) / 255

  // Calculate relative luminance
  const rs = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4)
  const gs = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4)
  const bs = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4)

  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

// Reduced motion detection
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

// High contrast detection
export function prefersHighContrast(): boolean {
  if (typeof window === 'undefined') return false
  
  return window.matchMedia('(prefers-contrast: high)').matches
}

// Screen reader detection
export function isUsingScreenReader(): boolean {
  if (typeof window === 'undefined') return false
  
  // Check for common screen reader indicators
  return !!(
    (window as any).speechSynthesis ||
    (navigator as any).userAgent?.includes('NVDA') ||
    (navigator as any).userAgent?.includes('JAWS') ||
    (navigator as any).userAgent?.includes('VoiceOver')
  )
}

// ARIA label helpers
export function generateAriaLabel(context: {
  action?: string
  target?: string
  state?: string
  position?: { current: number; total: number }
  additional?: string
}): string {
  const parts: string[] = []

  if (context.action) parts.push(context.action)
  if (context.target) parts.push(context.target)
  if (context.state) parts.push(`(${context.state})`)
  
  if (context.position) {
    parts.push(`(${context.position.current} of ${context.position.total})`)
  }
  
  if (context.additional) parts.push(context.additional)

  return parts.join(' ')
}

// Skip links helper
export function createSkipLinks(targets: Array<{ href: string; text: string }>): HTMLElement {
  const container = document.createElement('div')
  container.className = 'skip-links'
  container.style.cssText = `
    position: absolute;
    top: -1000px;
    left: 0;
    background: #000;
    color: #fff;
    padding: 8px;
    z-index: 10000;
    font-family: sans-serif;
    font-size: 14px;
  `

  targets.forEach(target => {
    const link = document.createElement('a')
    link.href = target.href
    link.textContent = target.text
    link.style.cssText = `
      color: #fff;
      text-decoration: underline;
      margin-right: 16px;
    `
    
    // Show on focus
    link.addEventListener('focus', () => {
      container.style.top = '0'
    })
    
    link.addEventListener('blur', () => {
      container.style.top = '-1000px'
    })

    container.appendChild(link)
  })

  return container
}

// Create global accessibility manager
export class AccessibilityManager {
  private liveRegion: ARIALiveRegion
  private focusManager: FocusManager
  private keyboardNav: KeyboardNavigation
  private config: AccessibilityConfig

  constructor(config: Partial<AccessibilityConfig> = {}) {
    this.config = {
      announcePageChanges: true,
      enableKeyboardNavigation: true,
      enableHighContrast: false,
      enableReducedMotion: false,
      enableFocusManagement: true,
      ...config
    }

    this.liveRegion = new ARIALiveRegion()
    this.focusManager = new FocusManager()
    this.keyboardNav = new KeyboardNavigation()

    this.initialize()
  }

  private initialize() {
    if (typeof window === 'undefined') return

    // Set up global keyboard navigation
    if (this.config.enableKeyboardNavigation) {
      document.addEventListener('keydown', (e) => {
        this.keyboardNav.handleKeyDown(e)
      })

      // Common shortcuts
      this.keyboardNav.addShortcut('alt+1', () => {
        const main = document.querySelector('main, [role="main"]') as HTMLElement
        if (main) this.focusManager.setFocus(main)
      }, 'Skip to main content')

      this.keyboardNav.addShortcut('alt+2', () => {
        const nav = document.querySelector('nav, [role="navigation"]') as HTMLElement
        if (nav) this.focusManager.setFocus(nav)
      }, 'Skip to navigation')

      this.keyboardNav.addShortcut('alt+h', () => {
        this.showHelp()
      }, 'Show keyboard shortcuts help')
    }

    // Handle focus management
    if (this.config.enableFocusManagement) {
      // Ensure focus is visible
      document.addEventListener('focusin', (e) => {
        const target = e.target as HTMLElement
        if (target) {
          target.style.outline = '2px solid #007acc'
          target.style.outlineOffset = '2px'
        }
      })

      document.addEventListener('focusout', (e) => {
        const target = e.target as HTMLElement
        if (target) {
          target.style.outline = ''
          target.style.outlineOffset = ''
        }
      })
    }

    // Apply user preferences
    this.applyUserPreferences()
  }

  private applyUserPreferences() {
    if (prefersReducedMotion()) {
      this.config.enableReducedMotion = true
      document.documentElement.style.setProperty('--motion-duration', '0ms')
    }

    if (prefersHighContrast()) {
      this.config.enableHighContrast = true
      document.documentElement.classList.add('high-contrast')
    }
  }

  private showHelp() {
    const shortcuts = this.keyboardNav.getShortcuts()
    const helpText = shortcuts
      .map(s => `${s.keys}: ${s.description}`)
      .join('\n')
    
    alert(`Keyboard Shortcuts:\n\n${helpText}`)
  }

  // Public API
  announce(message: string) {
    this.liveRegion.announce(message)
  }

  setFocus(element: HTMLElement | string) {
    this.focusManager.setFocus(element)
  }

  trapFocus(container: HTMLElement) {
    this.focusManager.trapFocus(container)
  }

  releaseFocusTrap() {
    this.focusManager.releaseFocusTrap()
  }

  addShortcut(keys: string, handler: () => void, description?: string) {
    this.keyboardNav.addShortcut(keys, handler, description)
  }

  destroy() {
    this.liveRegion.destroy()
  }
}

// Export singleton instance
export const a11y = new AccessibilityManager()
