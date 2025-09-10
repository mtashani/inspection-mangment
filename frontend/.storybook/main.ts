/**
 * Enhanced Storybook Main Configuration
 * Configures Storybook with addons, framework settings, and theme system
 */

import type { StorybookConfig } from '@storybook/nextjs'

const config: StorybookConfig = {
  stories: [
    '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/**/*.story.@(js|jsx|mjs|ts|tsx)',
  ],
  
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-viewport',
    '@storybook/addon-backgrounds',
    '@storybook/addon-measure',
    '@storybook/addon-outline',
    './addons/theme-controls/register.ts',
  ],
  
  framework: {
    name: '@storybook/nextjs',
    options: {},
  },
  
  docs: {
    autodocs: 'tag',
  },
  
  typescript: {
    check: false,
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  
  features: {
    experimentalRSC: true,
  },
  
  staticDirs: ['../public'],
  
  webpackFinal: async (config) => {
    // Add support for CSS custom properties and theme system
    if (config.module?.rules) {
      config.module.rules.push({
        test: /\.css$/,
        use: [
          {
            loader: 'postcss-loader',
            options: {
              postcssOptions: {
                plugins: [
                  require('tailwindcss'),
                  require('autoprefixer'),
                ],
              },
            },
          },
        ],
      })
    }
    
    // Add alias for theme system imports
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/design-system': require('path').resolve(__dirname, '../src/design-system'),
        '@/components': require('path').resolve(__dirname, '../src/components'),
        '@/hooks': require('path').resolve(__dirname, '../src/hooks'),
      }
    }
    
    return config
  },
  
  env: (config) => ({
    ...config,
    CHROMATIC_PROJECT_TOKEN: process.env.CHROMATIC_PROJECT_TOKEN || '',
    // Enable theme system debugging in Storybook
    STORYBOOK_THEME_DEBUG: 'true',
  }),
}

export default config