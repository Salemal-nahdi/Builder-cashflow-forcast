import { test, expect } from '@playwright/test'

test.describe('Builder Forecasting App - Smoke Tests', () => {
  test('should load the signin page', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Sign in/)
    
    // Check for signin form elements
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
    
    // Check for login method toggle
    await expect(page.locator('text=Password')).toBeVisible()
    await expect(page.locator('text=Magic Link')).toBeVisible()
    
    // Check for test credentials display
    await expect(page.locator('text=Test Credentials')).toBeVisible()
    await expect(page.locator('text=admin@demo.com')).toBeVisible()
  })

  test('should allow login with test credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Fill in credentials
    await page.fill('input[type="email"]', 'admin@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should redirect to dashboard
    await page.waitForURL('/dashboard')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should display dashboard after login', async ({ page }) => {
    // Login first
    await page.goto('/auth/signin')
    await page.fill('input[type="email"]', 'admin@demo.com')
    await page.fill('input[type="password"]', 'demo123')
    await page.click('button[type="submit"]')
    
    // Wait for dashboard to load
    await page.waitForURL('/dashboard')
    
    // Check dashboard elements
    await expect(page.locator('h1')).toContainText('Demo Organization')
    await expect(page.locator('text=Cashflow Dashboard')).toBeVisible()
    
    // Check for cash position overview cards
    await expect(page.locator('text=Current Balance')).toBeVisible()
    await expect(page.locator('text=6-Month Income')).toBeVisible()
    await expect(page.locator('text=6-Month Outgo')).toBeVisible()
    await expect(page.locator('text=Lowest Balance')).toBeVisible()
    
    // Check for forecast chart placeholder
    await expect(page.locator('text=6-Month Cashflow Forecast')).toBeVisible()
    
    // Check for quick actions
    await expect(page.locator('text=Forecast')).toBeVisible()
    await expect(page.locator('text=Variance')).toBeVisible()
    await expect(page.locator('text=Reports')).toBeVisible()
  })

  test('should display demo page', async ({ page }) => {
    await page.goto('/demo')
    
    // Check demo page loads
    await expect(page.locator('h1')).toContainText('Builder Cashflow Forecasting Demo')
    
    // Check for forecast controls
    await expect(page.locator('text=Monthly')).toBeVisible()
    await expect(page.locator('text=Weekly')).toBeVisible()
    
    // Check for chart types
    await expect(page.locator('text=Line Chart')).toBeVisible()
    await expect(page.locator('text=Bar Chart')).toBeVisible()
    
    // Check for forecast views
    await expect(page.locator('text=Consolidated')).toBeVisible()
    await expect(page.locator('text=By Project Breakdown')).toBeVisible()
  })

  test('should handle navigation between pages', async ({ page }) => {
    // Start at demo page
    await page.goto('/demo')
    await expect(page.locator('h1')).toContainText('Builder Cashflow Forecasting Demo')
    
    // Navigate to signin
    await page.click('text=Sign In')
    await page.waitForURL('/auth/signin')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    
    // Navigate back to demo
    await page.click('text=Try the demo instead')
    await page.waitForURL('/demo')
    await expect(page.locator('h1')).toContainText('Builder Cashflow Forecasting Demo')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    
    // Submit form
    await page.click('button[type="submit"]')
    
    // Should show error message
    await expect(page.locator('text=Invalid email or password')).toBeVisible()
    
    // Should stay on signin page
    await expect(page).toHaveURL('/auth/signin')
  })

  test('should toggle between password and magic link login', async ({ page }) => {
    await page.goto('/auth/signin')
    
    // Should start with password login
    await expect(page.locator('input[type="password"]')).toBeVisible()
    
    // Switch to magic link
    await page.click('text=Magic Link')
    await expect(page.locator('input[type="password"]')).not.toBeVisible()
    await expect(page.locator('text=Send Magic Link')).toBeVisible()
    
    // Switch back to password
    await page.click('text=Password')
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('text=Sign In')).toBeVisible()
  })
})
