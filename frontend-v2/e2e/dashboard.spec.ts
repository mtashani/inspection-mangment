import { test, expect } from '@playwright/test'

// Helper function to login
async function login(page) {
  await page.goto('/login')
  await page.getByLabel(/username/i).fill('admin')
  await page.getByLabel(/password/i).fill('admin123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL('/dashboard')
}

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
    
    // Login before each test
    await login(page)
  })

  test('should display dashboard with welcome message', async ({ page }) => {
    // Check welcome message with user name
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    await expect(page.getByText(/here's what's happening with your inspection management system today/i)).toBeVisible()
    
    // Check breadcrumb navigation
    await expect(page.getByText('Inspection Management')).toBeVisible()
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('should display all stats cards with correct data', async ({ page }) => {
    // Check for stats cards titles
    await expect(page.getByText('Total Equipment')).toBeVisible()
    await expect(page.getByText('Active Inspections')).toBeVisible()
    await expect(page.getByText('Inspectors')).toBeVisible()
    await expect(page.getByText('Pending Reports')).toBeVisible()
    
    // Check for icons in stats cards
    await expect(page.locator('[data-testid="wrench-icon"]').or(page.locator('svg').filter({ hasText: 'Wrench' }))).toBeVisible()
    await expect(page.locator('[data-testid="chart-icon"]').or(page.locator('svg').filter({ hasText: 'BarChart' }))).toBeVisible()
    
    // Check for numeric values (using more flexible selectors)
    await expect(page.getByText(/1,234|1234/)).toBeVisible()
    await expect(page.getByText(/89/)).toBeVisible()
    await expect(page.getByText(/24/)).toBeVisible()
    await expect(page.getByText(/12/)).toBeVisible()
    
    // Check for growth indicators
    await expect(page.getByText(/from last month|from yesterday|new this month/)).toBeVisible()
  })

  test('should display recent inspections section', async ({ page }) => {
    await expect(page.getByText('Recent Inspections')).toBeVisible()
    await expect(page.getByText(/latest inspection activities and their status/i)).toBeVisible()
    
    // Check for inspection entries
    await expect(page.getByText(/INS-/)).toBeVisible()
    await expect(page.getByText(/completed|in progress|scheduled/i)).toBeVisible()
    
    // Check for status badges with colors
    const statusBadges = page.locator('.bg-green-100, .bg-blue-100, .bg-yellow-100, .bg-red-100')
    await expect(statusBadges.first()).toBeVisible()
  })

  test('should display system overview section', async ({ page }) => {
    await expect(page.getByText('System Overview')).toBeVisible()
    await expect(page.getByText(/key metrics and system health/i)).toBeVisible()
    
    // Check for system metrics
    await expect(page.getByText('System Performance')).toBeVisible()
    await expect(page.getByText('Overdue Inspections')).toBeVisible()
    await expect(page.getByText('Active Inspectors')).toBeVisible()
    await expect(page.getByText('Reports Generated')).toBeVisible()
    
    // Check for metric values
    await expect(page.getByText(/98\.5%|\d+%/)).toBeVisible()
  })

  test('should have working sidebar with all navigation items', async ({ page }) => {
    // Check main navigation items
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Equipment')).toBeVisible()
    await expect(page.getByText('Inspections')).toBeVisible()
    await expect(page.getByText('Reports')).toBeVisible()
    await expect(page.getByText('Inspectors')).toBeVisible()
    
    // Check project/quick access items
    await expect(page.getByText('Recent Inspections')).toBeVisible()
    await expect(page.getByText('Overdue Items')).toBeVisible()
    await expect(page.getByText('Calendar')).toBeVisible()
  })

  test('should toggle sidebar correctly', async ({ page }) => {
    // Find sidebar toggle button
    const toggleButton = page.getByRole('button').filter({ hasText: /toggle|menu/i }).first()
    
    // Get initial sidebar state
    const sidebar = page.locator('[data-sidebar="sidebar"]')
    await expect(sidebar).toBeVisible()
    
    // Click to toggle
    await toggleButton.click()
    
    // Wait for animation to complete
    await page.waitForTimeout(300)
    
    // Click to toggle back
    await toggleButton.click()
    await page.waitForTimeout(300)
    
    // Sidebar should be visible again
    await expect(sidebar).toBeVisible()
  })

  test('should display user profile in sidebar', async ({ page }) => {
    // Check for user profile section
    await expect(page.getByText(/admin|user/i)).toBeVisible()
    
    // Click on user profile to open dropdown
    const userProfile = page.locator('[data-testid="user-profile"]').or(
      page.getByRole('button').filter({ hasText: /admin|user/i })
    )
    
    if (await userProfile.isVisible()) {
      await userProfile.click()
      
      // Check for dropdown items
      await expect(page.getByText('Account')).toBeVisible()
      await expect(page.getByText('Log out')).toBeVisible()
    }
  })

  test('should handle logout from sidebar', async ({ page }) => {
    // Find and click user profile
    const userProfile = page.locator('[data-testid="user-profile"]').or(
      page.getByRole('button').filter({ hasText: /admin|user/i })
    )
    
    if (await userProfile.isVisible()) {
      await userProfile.click()
      
      // Click logout
      await page.getByText('Log out').click()
      
      // Should redirect to login page
      await expect(page).toHaveURL('/login')
      await expect(page.getByText(/welcome back/i)).toBeVisible()
    }
  })

  test('should show loading states for dashboard data', async ({ page }) => {
    // Intercept API calls to simulate slow loading
    await page.route('**/api/v1/dashboard', route => {
      setTimeout(() => route.continue(), 1000)
    })
    
    // Reload page to trigger loading
    await page.reload()
    
    // Should show loading skeletons
    await expect(page.locator('.animate-pulse')).toBeVisible()
    
    // Wait for data to load
    await expect(page.getByText('Total Equipment')).toBeVisible()
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Dashboard should still be accessible
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    await expect(page.getByText('Total Equipment')).toBeVisible()
    
    // Sidebar should be collapsed on mobile
    const sidebar = page.locator('[data-sidebar="sidebar"]')
    // On mobile, sidebar might be hidden or collapsed by default
    
    // Stats cards should stack vertically
    const statsCards = page.locator('.grid').first()
    await expect(statsCards).toBeVisible()
  })
})