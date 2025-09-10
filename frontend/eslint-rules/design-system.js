/**
 * Custom ESLint rules for Design System compliance
 */

module.exports = {
  'no-hardcoded-colors': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow hardcoded color values, enforce CSS variables',
        category: 'Design System',
        recommended: true
      },
      fixable: 'code',
      schema: []
    },
    create(context) {
      const colorRegex = /#[0-9a-fA-F]{3,8}|rgb\(|rgba\(|hsl\(|hsla\(/
      
      return {
        Literal(node) {
          if (typeof node.value === 'string' && colorRegex.test(node.value)) {
            context.report({
              node,
              message: 'Use CSS variables instead of hardcoded colors. Example: var(--primary)',
              fix(fixer) {
                // Suggest common color variable replacements
                const colorMappings = {
                  '#2563eb': 'var(--primary)',
                  '#ffffff': 'var(--background)',
                  '#000000': 'var(--foreground)',
                  '#22c55e': 'var(--success)',
                  '#ef4444': 'var(--error)',
                  '#f59e0b': 'var(--warning)',
                  '#3b82f6': 'var(--info)'
                }
                
                const replacement = colorMappings[node.value.toLowerCase()]
                if (replacement) {
                  return fixer.replaceText(node, `"${replacement}"`)
                }
              }
            })
          }
        },
        
        TemplateLiteral(node) {
          node.quasis.forEach(quasi => {
            if (colorRegex.test(quasi.value.raw)) {
              context.report({
                node: quasi,
                message: 'Use CSS variables instead of hardcoded colors in template literals'
              })
            }
          })
        }
      }
    }
  },

  'no-arbitrary-values': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow arbitrary Tailwind values, enforce design tokens',
        category: 'Design System'
      },
      schema: []
    },
    create(context) {
      const arbitraryRegex = /\[([^\]]+)\]/
      
      return {
        Literal(node) {
          if (typeof node.value === 'string' && node.value.includes('className')) {
            return
          }
          
          if (typeof node.value === 'string' && arbitraryRegex.test(node.value)) {
            // Check if it's a className prop
            const parent = node.parent
            if (parent && parent.type === 'JSXExpressionContainer') {
              const jsxParent = parent.parent
              if (jsxParent && jsxParent.type === 'JSXAttribute' && 
                  jsxParent.name && jsxParent.name.name === 'className') {
                context.report({
                  node,
                  message: 'Avoid arbitrary Tailwind values. Use design system tokens instead.'
                })
              }
            }
          }
        }
      }
    }
  },

  'enforce-component-imports': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce importing components from design system',
        category: 'Design System'
      },
      schema: []
    },
    create(context) {
      const designSystemComponents = [
        'Button', 'Card', 'Input', 'Container', 'Grid', 'Stack', 
        'HStack', 'VStack', 'Badge', 'Alert', 'Loading', 'Skeleton'
      ]
      
      return {
        ImportDeclaration(node) {
          if (node.source.value === '@/components/ui' || 
              node.source.value.startsWith('@/components/ui/')) {
            // This is good - importing from design system
            return
          }
          
          // Check if importing design system components from wrong location
          node.specifiers.forEach(spec => {
            if (spec.type === 'ImportDefaultSpecifier' || 
                spec.type === 'ImportSpecifier') {
              const importName = spec.imported ? spec.imported.name : spec.local.name
              
              if (designSystemComponents.includes(importName) && 
                  !node.source.value.includes('@/components/ui')) {
                context.report({
                  node: spec,
                  message: `Import ${importName} from '@/components/ui' instead of '${node.source.value}'`
                })
              }
            }
          })
        }
      }
    }
  },

  'no-inline-styles': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Disallow inline styles, enforce Tailwind classes or CSS variables',
        category: 'Design System'
      },
      schema: []
    },
    create(context) {
      return {
        JSXAttribute(node) {
          if (node.name && node.name.name === 'style' && 
              node.value && node.value.type === 'JSXExpressionContainer') {
            
            // Allow inline styles that use CSS variables
            const code = context.getSourceCode().getText(node.value.expression)
            if (code.includes('var(--') || code.includes('...props.style')) {
              return // Allow CSS variables and style prop spreading
            }
            
            context.report({
              node,
              message: 'Avoid inline styles. Use Tailwind classes or CSS variables instead.'
            })
          }
        }
      }
    }
  },

  'enforce-typography-scale': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce design system typography scale',
        category: 'Design System'
      },
      schema: []
    },
    create(context) {
      const allowedTextSizes = [
        'text-xs', 'text-sm', 'text-base', 'text-lg', 
        'text-xl', 'text-2xl', 'text-3xl', 'text-4xl'
      ]
      
      const arbitraryTextRegex = /text-\[[^\]]+\]/
      
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            // Check for arbitrary text sizes
            if (arbitraryTextRegex.test(node.value)) {
              context.report({
                node,
                message: 'Use design system typography scale instead of arbitrary text sizes'
              })
            }
            
            // Check for non-standard text sizes
            const textSizeMatches = node.value.match(/text-\w+/g)
            if (textSizeMatches) {
              textSizeMatches.forEach(match => {
                if (!allowedTextSizes.includes(match) && !match.includes('[')) {
                  context.report({
                    node,
                    message: `Use standard typography scale. '${match}' is not in the design system scale.`
                  })
                }
              })
            }
          }
        }
      }
    }
  },

  'enforce-design-tokens': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce usage of design tokens for spacing, colors, and typography',
        category: 'Design System'
      },
      fixable: 'code',
      schema: []
    },
    create(context) {
      const designTokens = {
        spacing: [
          'space-0', 'space-px', 'space-0.5', 'space-1', 'space-1.5', 'space-2', 
          'space-2.5', 'space-3', 'space-3.5', 'space-4', 'space-5', 'space-6',
          'space-7', 'space-8', 'space-9', 'space-10', 'space-11', 'space-12',
          'space-14', 'space-16', 'space-20', 'space-24', 'space-28', 'space-32',
          'space-36', 'space-40', 'space-44', 'space-48', 'space-52', 'space-56',
          'space-60', 'space-64', 'space-72', 'space-80', 'space-96'
        ],
        colors: [
          'background', 'foreground', 'card', 'card-foreground', 'muted', 
          'muted-foreground', 'border', 'input', 'ring', 'success', 
          'success-foreground', 'warning', 'warning-foreground', 'error', 
          'error-foreground', 'info', 'info-foreground', 'primary', 
          'primary-foreground'
        ],
        // DaisyUI-style colors
        daisyColors: [
          'color-base-100', 'color-base-200', 'color-base-300', 'color-base-content',
          'color-primary', 'color-primary-content', 'color-secondary', 'color-secondary-content',
          'color-accent', 'color-accent-content', 'color-neutral', 'color-neutral-content',
          'color-info', 'color-info-content', 'color-success', 'color-success-content',
          'color-warning', 'color-warning-content', 'color-error', 'color-error-content'
        ],
        // Component-specific radius
        componentRadius: [
          'radius-box',      // Cards, modals, alerts
          'radius-field',    // Buttons, inputs, selects
          'radius-selector'  // Checkboxes, toggles, badges
        ],
        // Component sizing
        componentSizing: [
          'size-field',      // Button/input height
          'size-selector'    // Small controls size
        ],
        typography: [
          'font-size-xs', 'font-size-sm', 'font-size-base', 'font-size-lg',
          'font-size-xl', 'font-size-2xl', 'font-size-3xl', 'font-size-4xl',
          'font-size-5xl', 'font-size-6xl'
        ],
        radius: [
          'radius-none', 'radius-sm', 'radius-md', 'radius-lg', 'radius-xl',
          'radius-2xl', 'radius-3xl', 'radius-4xl', 'radius-5xl', 'radius-full'
        ]
      }
      
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            // Check for hardcoded pixel values that should use design tokens
            const pixelRegex = /(\d+)px/g
            const matches = node.value.match(pixelRegex)
            
            if (matches) {
              matches.forEach(match => {
                const pixels = parseInt(match.replace('px', ''))
                
                // Common spacing values that should use tokens
                const spacingMap = {
                  '0': 'var(--space-0)',
                  '1': 'var(--space-px)',
                  '2': 'var(--space-0.5)',
                  '4': 'var(--space-1)',
                  '6': 'var(--space-1.5)',
                  '8': 'var(--space-2)',
                  '10': 'var(--space-2.5)',
                  '12': 'var(--space-3)',
                  '14': 'var(--space-3.5)',
                  '16': 'var(--space-4)',
                  '20': 'var(--space-5)',
                  '24': 'var(--space-6)'
                }
                
                if (spacingMap[pixels.toString()]) {
                  context.report({
                    node,
                    message: `Use design token ${spacingMap[pixels.toString()]} instead of ${match}`,
                    fix(fixer) {
                      return fixer.replaceText(node, `"${spacingMap[pixels.toString()]}"`)
                    }
                  })
                }
              })
            }
          }
        }
      }
    }
  },

  'enforce-component-specific-tokens': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce component-specific design tokens (radius-box, radius-field, etc.)',
        category: 'Design System'
      },
      fixable: 'code',
      schema: []
    },
    create(context) {
      const componentTokenMappings = {
        // Radius mappings
        'rounded-lg': 'rounded-[var(--radius-field)]',
        'rounded-xl': 'rounded-[var(--radius-box)]',
        'rounded-md': 'rounded-[var(--radius-selector)]',
        'rounded-2xl': 'rounded-[var(--radius-box)]',
        
        // Height mappings for buttons/inputs
        'h-10': 'h-[var(--size-field)]',
        'h-9': 'h-[var(--size-field)]',
        'h-8': 'h-[var(--size-selector)]',
        
        // Color mappings to DaisyUI-style
        'bg-primary': 'bg-[var(--color-primary)]',
        'text-primary-foreground': 'text-[var(--color-primary-content)]',
        'bg-secondary': 'bg-[var(--color-secondary)]',
        'text-secondary-foreground': 'text-[var(--color-secondary-content)]',
        'bg-background': 'bg-[var(--color-base-100)]',
        'text-foreground': 'text-[var(--color-base-content)]'
      }
      
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            // Check if this is a className
            const parent = node.parent
            if (parent && parent.type === 'JSXExpressionContainer') {
              const jsxParent = parent.parent
              if (jsxParent && jsxParent.type === 'JSXAttribute' && 
                  jsxParent.name && jsxParent.name.name === 'className') {
                
                // Check for mappable classes
                Object.keys(componentTokenMappings).forEach(oldClass => {
                  if (node.value.includes(oldClass)) {
                    const newClass = componentTokenMappings[oldClass]
                    context.report({
                      node,
                      message: `Use component-specific token: ${newClass} instead of ${oldClass}`,
                      fix(fixer) {
                        const newValue = node.value.replace(oldClass, newClass.replace('rounded-[var(--radius-', 'rounded-[var(--radius-').replace(')]', ')]'))
                        return fixer.replaceText(node, `"${newValue}"`)
                      }
                    })
                  }
                })
              }
            }
          }
        }
      }
    }
  },

  'enforce-semantic-color-pairs': {
    meta: {
      type: 'problem',
      docs: {
        description: 'Enforce using semantic color pairs (primary + primary-content)',
        category: 'Design System'
      },
      schema: []
    },
    create(context) {
      const colorPairs = {
        'color-primary': 'color-primary-content',
        'color-secondary': 'color-secondary-content',
        'color-accent': 'color-accent-content',
        'color-neutral': 'color-neutral-content',
        'color-info': 'color-info-content',
        'color-success': 'color-success-content',
        'color-warning': 'color-warning-content',
        'color-error': 'color-error-content'
      }
      
      return {
        Literal(node) {
          if (typeof node.value === 'string') {
            // Check for background colors without corresponding text colors
            Object.keys(colorPairs).forEach(bgColor => {
              const textColor = colorPairs[bgColor]
              
              if (node.value.includes(`bg-[var(--${bgColor})]`)) {
                // Check if the corresponding text color is used
                const sourceCode = context.getSourceCode()
                const fullText = sourceCode.getText()
                
                if (!fullText.includes(`text-[var(--${textColor})]`)) {
                  context.report({
                    node,
                    message: `When using bg-[var(--${bgColor})], also use text-[var(--${textColor})] for proper contrast`
                  })
                }
              }
            })
          }
        }
      }
    }
  }
}