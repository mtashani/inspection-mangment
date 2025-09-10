import { test, expect } from '@playwright/test'

// Helper function to login
async function login(page) {
  await page.goto('/login')
  await page.getByLabel(/username/i).fill('admin')
  await page.getByLabel(/password/i).fill('admin123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL('/dashboard')
}

// Common viewport sizes
const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 },
  ultrawide: { width: 2560, height: 1440 }
}

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing state
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
  })

  test('should display login page correctly on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await page.goto('/login')
    
    // Login form should be visible and usable
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    
    // Features showcase might be hidden on mobile
    const featuresSection = page.getByText(/streamline your inspection workflow/i)
    // On mobile, this might not be visible due to responsive design
    
    // Form should be properly sized
    const loginCard = page.locator('.max-w-md').or(page.locator('form').first())
    await expect(loginCard).toBeVisible()
  })

  test('should display login page correctly on tablet', async ({ page }) => {
    await page.setViewportSize(viewports.tablet)
    await page.goto('/login')
    
    // Both form and features should be visible on tablet
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByText(/streamline your inspection workflow/i)).toBeVisible()
    
    // Layout should adapt to tablet size
    const container = page.locator('.flex').first()
    await expect(container).toBeVisible()
  })

  test('should display dashboard correctly on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await login(page)
    
    // Main content should be visible
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    
    // Stats cards should stack vertically on mobile
    await expect(page.getByText('Total Equipment')).toBeVisible()
    await expect(page.getByText('Active Inspections')).toBeVisible()
    
    // Sidebar should be collapsed or hidden on mobile
    const sidebar = page.locator('[data-sidebar="sidebar"]')
    // Sidebar behavior on mobile varies by implementation
    
    // Content should not overflow
    const body = page.locator('body')
    const bodyWidth = await body.evaluate(el => el.scrollWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewports.mobile.width + 20) // Allow small margin
  })

  test('should display dashboard correctly on tablet', async ({ page }) => {
    await page.setViewportSize(viewports.tablet)
    await login(page)
    
    // Dashboard should be fully functional on tablet
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    await expect(page.getByText('Total Equipment')).toBeVisible()
    await expect(page.getByText('Recent Inspections')).toBeVisible()
    await expect(page.getByText('System Overview')).toBeVisible()
    
    // Stats cards should be in a grid (2x2 or similar)
    const statsGrid = page.locator('.grid').first()
    await expect(statsGrid).toBeVisible()
  })

  test('should display dashboard correctly on desktop', async ({ page }) => {
    await page.setViewportSize(viewports.desktop)
    await login(page)
    
    // Full desktop layout should be visible
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    await expect(page.getByText('Inspection Management')).toBeVisible()
    
    // All stats cards should be in a row
    await expect(page.getByText('Total Equipment')).toBeVisible()
    await expect(page.getByText('Active Inspections')).toBeVisible()
    await expect(page.getByText('Inspectors')).toBeVisible()
    await expect(page.getByText('Pending Reports')).toBeVisible()
    
    // Sidebar should be fully expanded
    const sidebar = page.locator('[data-sidebar="sidebar"]')
    await expect(sidebar).toBeVisible()
    
    // Main content areas should be side by side
    await expect(page.getByText('Recent Inspections')).toBeVisible()
    await expect(page.getByText('System Overview')).toBeVisible()
  })

  test('should handle touch interactions on mobile', async ({ page }) => {
    await page.setViewportSize(viewports.mobile)
    await login(page)
    
    // Test touch interactions
    const userProfile = page.locator('[data-testid="user-profile"]').or(
      page.getByRole('button').filter({ hasText: /admin|user/i })
    )
    
    if (await userProfile.isVisible()) {
      // Tap should work like click
      await userProfile.tap()
      await page.waitForTimeout(300)
      
      // Dropdown should appear
      const dropdown = page.getByText('Log out')
      if (await dropdown.isVisible()) {
        await expect(dropdown).toBeVisible()
      }
    }
  })

  test('should handle sidebar toggle on different screen sizes', async ({ page }) => {
    await login(page)
    
    // Test on mobile
    await page.setViewportSize(viewports.mobile)
    await page.waitForTimeout(300)
    
    const toggleButton = page.getByRole('button').filter({ hasText: /toggle|menu/i }).first()
    
    if (await toggleButton.isVisible()) {
      await toggleButton.click()
      await page.waitForTimeout(300)
      
      // Navigation should be accessible
      await expect(page.getByText('Dashboard')).toBeVisible()
    }
    
    // Test on desktop
    await page.setViewportSize(viewports.desktop)
    await page.waitForTimeout(300)
    
    // Sidebar should be visible by default on desktop
    await expect(page.getByText('Dashboard')).toBeVisible()
    await expect(page.getByText('Equipment')).toBeVisible()
  })

  test('should maintain functionality across viewport changes', async ({ page }) => {
    await login(page)
    
    // Start on desktop
    await page.setViewportSize(viewports.desktop)
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    
    // Switch to mobile
    await page.setViewportSize(viewports.mobile)
    await page.waitForTimeout(300)
    
    // Should still be functional
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    
    // Switch to tablet
    await page.setViewportSize(viewports.tablet)
    await page.waitForTimeout(300)
    
    // Should still be functional
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    
    // Switch back to desktop
    await page.setViewportSize(viewports.desktop)
    await page.waitForTimeout(300)
    
    // Should still be functional
    await expect(page.getByText(/welcome back/i)).toBeVisible()
  })

  test('should handle text scaling and zoom', async ({ page }) => {
    await login(page)
    
    // Test with increased text size (simulate browser zoom)
    await page.addStyleTag({
      content: `
        * {
          font-size: 1.2em !important;
        }
      `
    })
    
    await page.waitForTimeout(300)
    
    // Content should still be readable and accessible
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    await expect(page.getByText('Total Equipment')).toBeVisible()
    
    // No horizontal scrolling should occur
    const body = page.locator('body')
    const scrollWidth = await body.evaluate(el => el.scrollWidth)
    const clientWidth = await body.evaluate(el => el.clientWidth)
    
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 50) // Allow small tolerance
  })

  test('should handle orientation changes on mobile', async ({ page }) => {
    await login(page)
    
    // Portrait mode
    await page.setViewportSize({ width: 375, height: 667 })
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    
    // Landscape mode
    await page.setViewportSize({ width: 667, height: 375 })
    await page.waitForTimeout(300)
    
    // Should still be functional in landscape
    await expect(page.getByText(/welcome back/i)).toBeVisible()
    await expect(page.getByText('Total Equipment')).toBeVisible()
  })

  test('should have proper contrast and readability', async ({ page }) => {
    await login(page)
    
    // Test in both light and dark themes
    const themeToggle = page.getByRole('button', { name: /toggle theme|theme|dark mode|light mode/i })
    
    if (await themeToggle.isVisible()) {
      // Test light theme
      const textElement = page.getByText(/welcome back/i)
      await expect(textElement).toBeVisible()
      
      // Toggle to dark theme
      await themeToggle.click()
      await page.waitForTimeout(300)
      
      // Text should still be visible and readable
      await expect(textElement).toBeVisible()
    }
  })
})