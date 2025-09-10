#!/usr/bin/env node

/**
 * Theme Testing Script
 * Tests all themes and validates CSS variables
 */

const fs = require('fs');
const path = require('path');

// Available themes
const THEMES = [
  'base',
  'cool-blue', 
  'warm-sand',
  'midnight-purple',
  'soft-gray',
  'warm-cream'
];

// Required CSS variables for each theme
const REQUIRED_VARIABLES = [
  '--background',
  '--foreground', 
  '--primary',
  '--primary-foreground',
  '--card',
  '--card-foreground',
  '--muted',
  '--muted-foreground',
  '--border',
  '--success',
  '--warning',
  '--error',
  '--info'
];

console.log('🎨 Design System Theme Tester\n');

// Read globals.css file
const globalsPath = path.join(__dirname, '../src/app/globals.css');
let globalsContent = '';

try {
  globalsContent = fs.readFileSync(globalsPath, 'utf8');
  console.log('✅ Successfully loaded globals.css');
} catch (error) {
  console.error('❌ Failed to load globals.css:', error.message);
  process.exit(1);
}

// Test each theme
THEMES.forEach(theme => {
  console.log(`\n🔍 Testing theme: ${theme}`);
  
  // Check if theme exists in CSS
  const themeSelector = theme === 'base' ? ':root' : `[data-theme="${theme}"]`;
  const themeRegex = new RegExp(`${themeSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{[^}]+}`, 'g');
  const themeMatch = globalsContent.match(themeRegex);
  
  if (!themeMatch) {
    console.log(`  ❌ Theme definition not found`);
    return;
  }
  
  console.log(`  ✅ Theme definition found`);
  
  // Extract theme content
  const themeContent = themeMatch[0];
  
  // Check required variables
  const missingVariables = [];
  REQUIRED_VARIABLES.forEach(variable => {
    if (!themeContent.includes(variable)) {
      missingVariables.push(variable);
    }
  });
  
  if (missingVariables.length > 0) {
    console.log(`  ⚠️  Missing variables: ${missingVariables.join(', ')}`);
  } else {
    console.log(`  ✅ All required variables present`);
  }
  
  // Extract color values
  const colorMatches = themeContent.match(/--[\w-]+:\s*#[0-9a-fA-F]{6}/g);
  if (colorMatches) {
    console.log(`  🎨 Colors found: ${colorMatches.length}`);
    colorMatches.slice(0, 3).forEach(match => {
      console.log(`    ${match}`);
    });
    if (colorMatches.length > 3) {
      console.log(`    ... and ${colorMatches.length - 3} more`);
    }
  }
});

// Generate theme comparison report
console.log('\n📊 Theme Comparison Report\n');

const themeData = {};
THEMES.forEach(theme => {
  const themeSelector = theme === 'base' ? ':root' : `[data-theme="${theme}"]`;
  const themeRegex = new RegExp(`${themeSelector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*{([^}]+)}`, 'g');
  const themeMatch = globalsContent.match(themeRegex);
  
  if (themeMatch) {
    const content = themeMatch[0];
    const primaryMatch = content.match(/--primary:\s*(#[0-9a-fA-F]{6})/);
    const backgroundMatch = content.match(/--background:\s*(#[0-9a-fA-F]{6})/);
    
    themeData[theme] = {
      primary: primaryMatch ? primaryMatch[1] : 'N/A',
      background: backgroundMatch ? backgroundMatch[1] : 'N/A'
    };
  }
});

// Display comparison table
console.log('Theme'.padEnd(20) + 'Primary'.padEnd(12) + 'Background');
console.log('-'.repeat(50));
Object.entries(themeData).forEach(([theme, data]) => {
  console.log(
    theme.padEnd(20) + 
    data.primary.padEnd(12) + 
    data.background
  );
});

// Generate HTML test file info
console.log('\n🌐 Testing Options:');
console.log('1. Open theme-test.html in your browser');
console.log('2. Use browser DevTools console:');
console.log('   document.documentElement.setAttribute("data-theme", "cool-blue")');
console.log('3. Test in your Next.js app with theme context');

// Validate design tokens export
const tokensPath = path.join(__dirname, '../design-tokens-export.json');
try {
  const tokensContent = fs.readFileSync(tokensPath, 'utf8');
  const tokens = JSON.parse(tokensContent);
  console.log('\n✅ Design tokens export file is valid');
  console.log(`   Themes in export: ${Object.keys(tokens.themes || {}).length}`);
} catch (error) {
  console.log('\n⚠️  Design tokens export file issue:', error.message);
}

console.log('\n🎉 Theme testing complete!');
console.log('\nNext steps:');
console.log('- Open frontend/theme-test.html to test themes visually');
console.log('- Run Storybook when available for interactive testing');
console.log('- Use the theme context in your Next.js components');