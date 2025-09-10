import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
  })

  test('should display login page with all elements', async ({ page }) => {
    await page.goto('/login')
    
    // Check main heading and description
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
    await expect(page.getByText(/sign in to access your inspection management dashboard/i)).toBeVisible()
    
    // Check form elements
    await expect(page.getByLabel(/username/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
    
    // Check password visibility toggle
    await expect(page.getByRole('button', { name: /toggle password visibility/i })).toBeVisible()
    
    // Check features showcase (left side)
    await expect(page.getByText(/streamline your inspection workflow/i)).toBeVisible()
    await expect(page.getByText(/advanced security/i)).toBeVisible()
    await expect(page.getByText(/real-time analytics/i)).toBeVisible()
  })

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login')
    
    // Try to submit empty form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Check for validation errors
    await expect(page.getByText(/username is required/i)).toBeVisible()
    await expect(page.getByText(/password is required/i)).toBeVisible()
  })

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login')
    
    const passwordInput = page.getByLabel(/password/i)
    const toggleButton = page.getByRole('button', { name: /toggle password visibility/i })
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password')
    
    // Click toggle to show password
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'text')
    
    // Click toggle to hide password again
    await toggleButton.click()
    await expect(passwordInput).toHaveAttribute('type', 'password')
  })

  test('should show loading state during login', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in credentials
    await page.getByLabel(/username/i).fill('admin')
    await page.getByLabel(/password/i).fill('admin123')
    
    // Submit form and check loading state
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show loading text
    await expect(page.getByText(/signing in/i)).toBeVisible()
    
    // Form should be disabled during loading
    await expect(page.getByLabel(/username/i)).toBeDisabled()
    await expect(page.getByLabel(/password/i)).toBeDisabled()
  })

  test('should redirect to dashboard on successful login', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in login form
    await page.getByLabel(/username/i).fill('admin')
    await page.getByLabel(/password/i).fill('admin123')
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show redirecting message
    await expect(page.getByText(/redirecting to dashboard/i)).toBeVisible()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.getByText(/welcome back/i)).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    // Fill in invalid credentials
    await page.getByLabel(/username/i).fill('invalid')
    await page.getByLabel(/password/i).fill('invalid')
    
    // Submit form
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show error message
    await expect(page.getByText(/invalid username or password/i)).toBeVisible()
    
    // Should show toast notification
    await expect(page.locator('[data-sonner-toast]')).toBeVisible()
    
    // Password field should be cleared but username should remain
    await expect(page.getByLabel(/username/i)).toHaveValue('invalid')
    await expect(page.getByLabel(/password/i)).toHaveValue('')
  })

  test('should redirect authenticated users away from login', async ({ page }) => {
    // First login
    await page.goto('/login')
    await page.getByLabel(/username/i).fill('admin')
    await page.getByLabel(/password/i).fill('admin123')
    await page.getByRole('button', { name: /sign in/i }).click()
    await expect(page).toHaveURL('/dashboard')
    
    // Try to go back to login page
    await page.goto('/login')
    
    // Should be redirected back to dashboard
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Intercept login request and make it fail
    await page.route('**/api/v1/auth/login', route => {
      route.abort('failed')
    })
    
    await page.goto('/login')
    await page.getByLabel(/username/i).fill('admin')
    await page.getByLabel(/password/i).fill('admin123')
    await page.getByRole('button', { name: /sign in/i }).click()
    
    // Should show network error message
    await expect(page.getByText(/network error/i)).toBeVisible()
  })
})