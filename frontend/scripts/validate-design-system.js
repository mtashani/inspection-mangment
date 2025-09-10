#!/usr/bin/env node

/**
 * Design System Validation Script
 * Validates design tokens, theme consistency, and component compliance
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🎨 Design System Validation Starting...\n')

let hasErrors = false

// Validate CSS Variables
function validateCSSVariables() {
  console.log('📋 Validating CSS Variables...')
  
  try {
    const globalsCSS = fs.readFileSync('src/app/globals.css', 'utf8')
    
    // Required CSS variables
    const requiredVariables = [
      '--background', '--foreground', '--card', '--card-foreground',
      '--muted', '--muted-foreground', '--border', '--input', '--ring',
      '--primary', '--primary-foreground', '--success', '--success-foreground',
      '--warning', '--warning-foreground', '--error', '--error-foreground',
      '--info', '--info-foreground'
    ]
    
    const missingVariables = requiredVariables.filter(variable => 
      !globalsCSS.includes(variable)
    )
    
    if (missingVariables.length > 0) {
      console.error('❌ Missing required CSS variables:')
      missingVariables.forEach(variable => console.error(`   - ${variable}`))
      hasErrors = true
    } else {
      console.log('✅ All required CSS variables present')
    }
  } catch (error) {
    console.error('❌ Error reading globals.css:', error.message)
    hasErrors = true
  }
}

// Validate Theme Consistency
function validateThemes() {
  console.log('🎨 Validating Theme Consistency...')
  
  try {
    const themesDir = 'src/design-system/themes'
    if (!fs.existsSync(themesDir)) {
      console.error('❌ Themes directory not found')
      hasErrors = true
      return
    }
    
    const themeFiles = fs.readdirSync(themesDir)
      .filter(file => file.endsWith('.ts') && file !== 'index.ts')
    
    if (themeFiles.length === 0) {
      console.error('❌ No theme files found')
      hasErrors = true
      return
    }
    
    console.log(`✅ Found ${themeFiles.length} theme files`)
    
    // Validate each theme has required structure
    themeFiles.forEach(file => {
      try {
        const themeContent = fs.readFileSync(path.join(themesDir, file), 'utf8')
        
        // Check for required theme properties
        const requiredProps = ['id', 'name', 'description', 'tokens']
        const missingProps = requiredProps.filter(prop => 
          !themeContent.includes(`${prop}:`)
        )
        
        if (missingProps.length > 0) {
          console.error(`❌ Theme ${file} missing properties: ${missingProps.join(', ')}`)
          hasErrors = true
        }
      } catch (error) {
        console.error(`❌ Error reading theme file ${file}:`, error.message)
        hasErrors = true
      }
    })
    
    if (!hasErrors) {
      console.log('✅ All themes have consistent structure')
    }
  } catch (error) {
    console.error('❌ Error validating themes:', error.message)
    hasErrors = true
  }
}

// Validate Component Exports
function validateComponentExports() {
  console.log('🧩 Validating Component Exports...')
  
  try {
    const componentsDir = 'src/components/ui'
    if (!fs.existsSync(componentsDir)) {
      console.error('❌ Components directory not found')
      hasErrors = true
      return
    }
    
    const componentFiles = fs.readdirSync(componentsDir)
      .filter(file => file.endsWith('.tsx') && !file.includes('.stories.'))
    
    const requiredComponents = [
      'button.tsx', 'card.tsx', 'input.tsx', 'container.tsx', 
      'grid.tsx', 'stack.tsx', 'badge.tsx', 'alert.tsx', 
      'loading.tsx', 'skeleton.tsx'
    ]
    
    const missingComponents = requiredComponents.filter(component => 
      !componentFiles.includes(component)
    )
    
    if (missingComponents.length > 0) {
      console.error('❌ Missing required components:')
      missingComponents.forEach(component => console.error(`   - ${component}`))
      hasErrors = true
    } else {
      console.log('✅ All required components present')
    }
    
    // Validate each component has proper exports
    componentFiles.forEach(file => {
      try {
        const componentContent = fs.readFileSync(path.join(componentsDir, file), 'utf8')
        
        // Check for proper TypeScript exports
        if (!componentContent.includes('export') || !componentContent.includes('React.forwardRef')) {
          console.warn(`⚠️  Component ${file} may not follow standard patterns`)
        }
      } catch (error) {
        console.error(`❌ Error reading component ${file}:`, error.message)
        hasErrors = true
      }
    })
    
  } catch (error) {
    console.error('❌ Error validating components:', error.message)
    hasErrors = true
  }
}

// Validate Storybook Stories
function validateStories() {
  console.log('📚 Validating Storybook Stories...')
  
  try {
    const storiesPattern = 'src/**/*.stories.{ts,tsx}'
    const result = execSync(`find src -name "*.stories.tsx" -o -name "*.stories.ts" | wc -l`, { encoding: 'utf8' })
    const storyCount = parseInt(result.trim())
    
    if (storyCount < 10) {
      console.warn(`⚠️  Only ${storyCount} stories found. Consider adding more comprehensive coverage.`)
    } else {
      console.log(`✅ Found ${storyCount} Storybook stories`)
    }
    
    // Check if main components have stories
    const requiredStories = [
      'button.stories.tsx', 'card.stories.tsx', 'input.stories.tsx',
      'badge.stories.tsx', 'alert.stories.tsx', 'loading.stories.tsx'
    ]
    
    requiredStories.forEach(story => {
      const storyPath = `src/components/ui/${story}`
      if (!fs.existsSync(storyPath)) {
        console.error(`❌ Missing story file: ${story}`)
        hasErrors = true
      }
    })
    
  } catch (error) {
    console.error('❌ Error validating stories:', error.message)
    hasErrors = true
  }
}

// Validate Design Tokens
function validateDesignTokens() {
  console.log('🎯 Validating Design Tokens...')
  
  try {
    const tokensDir = 'src/design-system/tokens'
    if (!fs.existsSync(tokensDir)) {
      console.error('❌ Design tokens directory not found')
      hasErrors = true
      return
    }
    
    const requiredTokenFiles = ['colors.ts', 'typography.ts', 'spacing.ts']
    const missingTokenFiles = requiredTokenFiles.filter(file => 
      !fs.existsSync(path.join(tokensDir, file))
    )
    
    if (missingTokenFiles.length > 0) {
      console.error('❌ Missing token files:')
      missingTokenFiles.forEach(file => console.error(`   - ${file}`))
      hasErrors = true
    } else {
      console.log('✅ All required token files present')
    }
    
  } catch (error) {
    console.error('❌ Error validating design tokens:', error.message)
    hasErrors = true
  }
}

// Run all validations
async function runValidation() {
  validateCSSVariables()
  validateThemes()
  validateComponentExports()
  validateStories()
  validateDesignTokens()
  
  console.log('\n' + '='.repeat(50))
  
  if (hasErrors) {
    console.log('❌ Design System validation failed!')
    console.log('Please fix the errors above before committing.')
    process.exit(1)
  } else {
    console.log('✅ Design System validation passed!')
    console.log('All components, themes, and tokens are properly configured.')
  }
}

// Run if called directly
if (require.main === module) {
  runValidation()
}

module.exports = { runValidation }