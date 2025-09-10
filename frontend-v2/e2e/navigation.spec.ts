import { test, expect } from '@playwright/test'

// Helper function to login
async function login(page) {
  await page.goto('/login')
  await page.getByLabel(/username/i).fill('admin')
  await page.getByLabel(/password/i).fill('admin123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL('/dashboard')
}

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing state
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
    
    // Login before each test
    await login(page)
  })

  test('should navigate between main sections', async ({ page }) => {
    // Test navigation to Equipment section
    const equipmentLink = page.getByRole('link', { name: /equipment/i }).or(
      page.getByText('Equipment').first()
    )
    
    if (await equipmentLink.isVisible()) {
      await equipmentLink.click()
      // Should navigate to equipment page (might be /equipment or show dropdown)
      await page.waitForTimeout(500)
    }
    
    // Test navigation to Inspections section
    const inspectionsLink = page.getByRole('link', { name: /inspections/i }).or(
      page.getByText('Inspections').first()
    )
    
    if (await inspectionsLink.isVisible()) {
      await inspectionsLink.click()
      await page.waitForTimeout(500)
    }
    
    // Test navigation back to Dashboard
    const dashboardLink = page.getByRole('link', { name: /dashboard/i }).or(
      page.getByText('Dashboard').first()
    )
    
    await dashboardLink.click()
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle breadcrumb navigation', async ({ page }) => {
    // Check breadcrumb is present
    await expect(page.getByText('Inspection Management')).toBeVisible()
    await expect(page.getByText('Dashboard')).toBeVisible()
    
    // Breadcrumb should show current page
    const breadcrumb = page.locator('[data-testid="breadcrumb"]').or(
      page.locator('nav').filter({ hasText: 'Dashboard' })
    )
    
    await expect(breadcrumb).toBeVisible()
  })

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Navigate to a different section if possible
    const equipmentLink = page.getByText('Equipment').first()
    
    if (await equipmentLink.isVisible()) {
      await equipmentLink.click()
      await page.waitForTimeout(500)
      
      // Use browser back button
      await page.goBack()
      await expect(page).toHaveURL('/dashboard')
      
      // Use browser forward button
      await page.goForward()
      await page.waitForTimeout(500)
    }
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Clear authentication
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
    
    // Try to access dashboard directly
    await page.goto('/dashboard')
    
    // Should be redirected to login
    await expect(page).toHaveURL('/login')
    await expect(page.getByText(/welcome back/i)).toBeVisible()
  })

  test('should redirect from root to appropriate page', async ({ page }) => {
    // Go to root URL
    await page.goto('/')
    
    // Should redirect to dashboard (since user is logged in)
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle deep linking correctly', async ({ page }) => {
    // Try to access a deep link (if equipment pages exist)
    await page.goto('/equipment')
    
    // Should either show equipment page or redirect appropriately
    // The exact behavior depends on whether the route exists
    await page.waitForTimeout(1000)
    
    // Should not be on login page (since user is authenticated)
    expect(page.url()).not.toContain('/login')
  })

  test('should maintain navigation state during theme changes', async ({ page }) => {
    // Find theme toggle
    const themeToggle = page.getByRole('button', { name: /toggle theme|theme|dark mode|light mode/i })
    
    if (await themeToggle.isVisible()) {
      // Toggle theme
      await themeToggle.click()
      await page.waitForTimeout(300)
      
      // Navigation should still work
      await expect(page.getByText('Dashboard')).toBeVisible()
      await expect(page.getByText('Equipment')).toBeVisible()
      await expect(page.getByText('Inspections')).toBeVisible()
      
      // Should still be on dashboard
      await expect(page).toHaveURL('/dashboard')
    }
  })

  test('should handle sidebar navigation on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // On mobile, sidebar might be hidden by default
    // Look for menu button to open sidebar
    const menuButton = page.getByRole('button', { name: /menu|toggle|sidebar/i }).first()
    
    if (await menuButton.isVisible()) {
      await menuButton.click()
      await page.waitForTimeout(300)
      
      // Navigation items should be visible
      await expect(page.getByText('Dashboard')).toBeVisible()
      await expect(page.getByText('Equipment')).toBeVisible()
    }
  })

  test('should show active navigation state', async ({ page }) => {
    // Dashboard should be marked as active
    const dashboardNav = page.getByText('Dashboard').first()
    
    // Check if it has active styling (this depends on implementation)
    const dashboardParent = dashboardNav.locator('..')
    const classList = await dashboardParent.getAttribute('class')
    
    // Should have some active indicator (bg-accent, text-accent-foreground, etc.)
    expect(classList).toMatch(/active|accent|current|selected/)
  })

  test('should handle keyboard navigation', async ({ page }) => {
    // Focus on first navigation item
    await page.keyboard.press('Tab')
    
    // Should be able to navigate with arrow keys
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    
    // Should be able to activate with Enter
    await page.keyboard.press('Enter')
    
    // Should navigate or show submenu
    await page.waitForTimeout(500)
  })

  test('should handle logout and redirect', async ({ page }) => {
    // Find user profile/logout
    const userProfile = page.locator('[data-testid="user-profile"]').or(
      page.getByRole('button').filter({ hasText: /admin|user/i })
    )
    
    if (await userProfile.isVisible()) {
      await userProfile.click()
      
      const logoutButton = page.getByText('Log out')
      await logoutButton.click()
      
      // Should redirect to login
      await expect(page).toHaveURL('/login')
      
      // Try to access dashboard again
      await page.goto('/dashboard')
      
      // Should be redirected back to login
      await expect(page).toHaveURL('/login')
    }
  })
})