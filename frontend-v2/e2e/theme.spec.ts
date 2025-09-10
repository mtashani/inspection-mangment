import { test, expect } from '@playwright/test'

// Helper function to login
async function login(page) {
  await page.goto('/login')
  await page.getByLabel(/username/i).fill('admin')
  await page.getByLabel(/password/i).fill('admin123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL('/dashboard')
}

test.describe('Theme Switching', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing state
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
    
    // Login to access dashboard
    await login(page)
  })

  test('should have theme toggle button', async ({ page }) => {
    // Look for theme toggle button (might be in header or sidebar)
    const themeToggle = page.getByRole('button', { name: /toggle theme|theme|dark mode|light mode/i })
    await expect(themeToggle).toBeVisible()
  })

  test('should switch between light and dark themes', async ({ page }) => {
    // Get initial theme
    const html = page.locator('html')
    const initialClass = await html.getAttribute('class')
    
    // Find theme toggle button
    const themeToggle = page.getByRole('button', { name: /toggle theme|theme|dark mode|light mode/i })
    
    if (await themeToggle.isVisible()) {
      // Click to switch theme
      await themeToggle.click()
      
      // Wait for theme change
      await page.waitForTimeout(300)
      
      // Check that theme class has changed
      const newClass = await html.getAttribute('class')
      expect(newClass).not.toBe(initialClass)
      
      // Click again to switch back
      await themeToggle.click()
      await page.waitForTimeout(300)
      
      // Should be back to original theme or different from the previous
      const finalClass = await html.getAttribute('class')
      expect(finalClass).not.toBe(newClass)
    }
  })

  test('should persist theme preference across page reloads', async ({ page }) => {
    const html = page.locator('html')
    
    // Find and click theme toggle
    const themeToggle = page.getByRole('button', { name: /toggle theme|theme|dark mode|light mode/i })
    
    if (await themeToggle.isVisible()) {
      await themeToggle.click()
      await page.waitForTimeout(300)
      
      const themeAfterToggle = await html.getAttribute('class')
      
      // Reload page
      await page.reload()
      await page.waitForTimeout(500)
      
      // Theme should be preserved
      const themeAfterReload = await html.getAttribute('class')
      expect(themeAfterReload).toBe(themeAfterToggle)
    }
  })

  test('should apply theme to all UI elements', async ({ page }) => {
    // Check that theme affects various UI elements
    const card = page.locator('.bg-card, .bg-background').first()
    const text = page.locator('.text-foreground, .text-muted-foreground').first()
    
    await expect(card).toBeVisible()
    await expect(text).toBeVisible()
    
    // Get initial styles
    const initialCardBg = await card.evaluate(el => getComputedStyle(el).backgroundColor)
    const initialTextColor = await text.evaluate(el => getComputedStyle(el).color)
    
    // Toggle theme
    const themeToggle = page.getByRole('button', { name: /toggle theme|theme|dark mode|light mode/i })
    
    if (await themeToggle.isVisible()) {
      await themeToggle.click()
      await page.waitForTimeout(300)
      
      // Check that styles have changed
      const newCardBg = await card.evaluate(el => getComputedStyle(el).backgroundColor)
      const newTextColor = await text.evaluate(el => getComputedStyle(el).color)
      
      // Colors should be different (though we can't predict exact values)
      expect(newCardBg).not.toBe(initialCardBg)
      expect(newTextColor).not.toBe(initialTextColor)
    }
  })

  test('should work on login page as well', async ({ page }) => {
    // Go to login page
    await page.goto('/login')
    
    // Look for theme toggle on login page
    const themeToggle = page.getByRole('button', { name: /toggle theme|theme|dark mode|light mode/i })
    
    // Theme toggle might not be visible on login page, that's okay
    if (await themeToggle.isVisible()) {
      const html = page.locator('html')
      const initialClass = await html.getAttribute('class')
      
      await themeToggle.click()
      await page.waitForTimeout(300)
      
      const newClass = await html.getAttribute('class')
      expect(newClass).not.toBe(initialClass)
    }
  })

  test('should respect system theme preference', async ({ page }) => {
    // Set system to dark mode
    await page.emulateMedia({ colorScheme: 'dark' })
    
    // Reload page to pick up system preference
    await page.reload()
    await page.waitForTimeout(500)
    
    // Check if dark theme is applied
    const html = page.locator('html')
    const htmlClass = await html.getAttribute('class')
    
    // Should contain dark class or have dark theme applied
    expect(htmlClass).toMatch(/dark|system/)
    
    // Switch to light system theme
    await page.emulateMedia({ colorScheme: 'light' })
    await page.reload()
    await page.waitForTimeout(500)
    
    const newHtmlClass = await html.getAttribute('class')
    // Theme should change based on system preference
    expect(newHtmlClass).not.toBe(htmlClass)
  })
})