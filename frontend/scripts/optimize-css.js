#!/usr/bin/env node

/**
 * CSS Optimization Script
 * Optimizes CSS variables, removes unused styles, and implements scoping
 */

const fs = require('fs')
const path = require('path')

console.log('🎨 CSS Optimization Starting...\n')

// CSS Variable Scoping for Performance
function optimizeCSSVariables() {
  console.log('📋 Optimizing CSS Variables...')
  
  try {
    const globalsPath = 'src/app/globals.css'
    let globalsCSS = fs.readFileSync(globalsPath, 'utf8')
    
    // Add CSS containment for better performance
    const containmentCSS = `
/* CSS Containment for Performance */
.design-system-component {
  contain: layout style paint;
}

/* Optimize CSS variable inheritance */
:root {
  /* Force hardware acceleration for theme switching */
  transform: translateZ(0);
  will-change: background-color, color;
}

/* Scoped CSS variables for components */
.card-component {
  --local-card-bg: var(--card);
  --local-card-fg: var(--card-foreground);
  --local-card-border: var(--border);
}

.button-component {
  --local-primary: var(--primary);
  --local-primary-fg: var(--primary-foreground);
  --local-ring: var(--ring);
}

.input-component {
  --local-input-bg: var(--input);
  --local-input-border: var(--border);
  --local-input-ring: var(--ring);
}
`
    
    // Insert containment CSS before the theme definitions
    const themeIndex = globalsCSS.indexOf('/* Cool Blue Theme */')
    if (themeIndex !== -1) {
      globalsCSS = globalsCSS.slice(0, themeIndex) + containmentCSS + '\n' + globalsCSS.slice(themeIndex)
      
      fs.writeFileSync(globalsPath, globalsCSS)
      console.log('✅ CSS variables optimized with scoping and containment')
    } else {
      console.warn('⚠️  Could not find theme section to insert optimizations')
    }
    
  } catch (error) {
    console.error('❌ Error optimizing CSS variables:', error.message)
  }
}

// Critical CSS Extraction
function extractCriticalCSS() {
  console.log('🎯 Extracting Critical CSS...')
  
  const criticalCSS = `
/* Critical CSS - Above the fold styles */
:root {
  --background: #ffffff;
  --foreground: #0f172a;
  --card: #f8fafc;
  --card-foreground: #0f172a;
  --primary: #2563eb;
  --primary-foreground: #ffffff;
  --border: #e2e8f0;
  --font-size-base: 1rem;
  --space-4: 1rem;
  --radius-lg: 0.375rem;
}

body {
  background-color: var(--background);
  color: var(--foreground);
  font-size: var(--font-size-base);
}

/* Critical component styles */
.button-critical {
  background-color: var(--primary);
  color: var(--primary-foreground);
  padding: var(--space-4);
  border-radius: var(--radius-lg);
  border: none;
  cursor: pointer;
}

.card-critical {
  background-color: var(--card);
  color: var(--card-foreground);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: var(--space-4);
}
`
  
  try {
    fs.writeFileSync('src/app/critical.css', criticalCSS)
    console.log('✅ Critical CSS extracted to critical.css')
  } catch (error) {
    console.error('❌ Error extracting critical CSS:', error.message)
  }
}

// Tree Shaking Configuration
function setupTreeShaking() {
  console.log('🌳 Setting up CSS Tree Shaking...')
  
  const purgeCSSConfig = {
    content: [
      './src/**/*.{js,ts,jsx,tsx}',
      './src/components/**/*.{js,ts,jsx,tsx}',
      './src/stories/**/*.{js,ts,jsx,tsx}'
    ],
    css: ['./src/app/globals.css'],
    safelist: [
      // Always keep these classes
      /^animate-/,
      /^transition-/,
      /^duration-/,
      /^ease-/,
      // Design system classes
      /^design-system-/,
      // Theme classes
      /^theme-/,
      // Component state classes
      /^hover:/,
      /^focus:/,
      /^active:/,
      /^disabled:/,
      // Responsive classes
      /^sm:/,
      /^md:/,
      /^lg:/,
      /^xl:/,
      /^2xl:/
    ],
    defaultExtractor: content => content.match(/[\\w-/:]+(?<!:)/g) || []
  }
  
  try {
    fs.writeFileSync('purgecss.config.js', `module.exports = ${JSON.stringify(purgeCSSConfig, null, 2)}`)
    console.log('✅ PurgeCSS configuration created')
  } catch (error) {
    console.error('❌ Error setting up tree shaking:', error.message)
  }
}

// Bundle Size Analysis
function analyzeBundleSize() {
  console.log('📊 Analyzing Bundle Size...')
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    
    // Add bundle analysis scripts if not present
    if (!packageJson.scripts['analyze']) {
      packageJson.scripts['analyze'] = 'ANALYZE=true npm run build'
      packageJson.scripts['bundle:analyze'] = 'npx @next/bundle-analyzer'
      packageJson.scripts['css:analyze'] = 'npx bundlesize'
      
      fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2))
      console.log('✅ Bundle analysis scripts added to package.json')
    }
    
    // Check current bundle size limits
    if (packageJson.bundlesize) {
      console.log('📦 Current bundle size limits:')
      packageJson.bundlesize.forEach(limit => {
        console.log(`   - ${limit.path}: ${limit.maxSize}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error analyzing bundle size:', error.message)
  }
}

// CSS Minification and Optimization
function optimizeCSS() {
  console.log('⚡ Optimizing CSS for Production...')
  
  const postcssConfig = `
module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'cssnano': {
      preset: ['default', {
        discardComments: {
          removeAll: true,
        },
        normalizeWhitespace: true,
        colormin: false, // Preserve CSS variables
        minifyFontValues: false, // Preserve font tokens
      }]
    },
    '@fullhuman/postcss-purgecss': process.env.NODE_ENV === 'production' ? {
      content: [
        './src/**/*.{js,ts,jsx,tsx}',
        './src/components/**/*.{js,ts,jsx,tsx}',
      ],
      safelist: [
        /^animate-/,
        /^transition-/,
        /^hover:/,
        /^focus:/,
        /^active:/,
        /^disabled:/,
        /^sm:/,
        /^md:/,
        /^lg:/,
        /^xl:/,
        /^2xl:/,
      ]
    } : false
  }
}
`
  
  try {
    fs.writeFileSync('postcss.config.js', postcssConfig)
    console.log('✅ PostCSS configuration optimized')
  } catch (error) {
    console.error('❌ Error optimizing CSS:', error.message)
  }
}

// Run all optimizations
async function runOptimization() {
  optimizeCSSVariables()
  extractCriticalCSS()
  setupTreeShaking()
  analyzeBundleSize()
  optimizeCSS()
  
  console.log('\n' + '='.repeat(50))
  console.log('✅ CSS Optimization completed!')
  console.log('📊 Run "npm run analyze" to check bundle sizes')
  console.log('🎯 Critical CSS available in src/app/critical.css')
}

// Run if called directly
if (require.main === module) {
  runOptimization()
}

module.exports = { runOptimization }