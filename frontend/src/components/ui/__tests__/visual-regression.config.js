// Visual Regression Testing Configuration
module.exports = {
  // Chromatic configuration for visual regression testing
  chromatic: {
    projectToken: process.env.CHROMATIC_PROJECT_TOKEN,
    buildScriptName: 'build-storybook',
    exitZeroOnChanges: true,
    exitOnceUploaded: true,
    ignoreLastBuildOnBranch: 'main'
  },

  // Playwright configuration for visual testing
  playwright: {
    testDir: './tests/visual',
    use: {
      baseURL: 'http://localhost:3000',
      screenshot: 'only-on-failure',
      video: 'retain-on-failure'
    },
    projects: [
      {
        name: 'chromium',
        use: { ...devices['Desktop Chrome'] }
      },
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] }
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] }
      }
    ]
  },

  // Accessibility testing configuration
  accessibility: {
    // axe-core configuration
    axe: {
      rules: {
        'color-contrast': { enabled: true },
        'keyboard-navigation': { enabled: true },
        'focus-management': { enabled: true },
        'aria-labels': { enabled: true }
      },
      tags: ['wcag2a', 'wcag2aa', 'wcag21aa']
    },

    // Lighthouse CI configuration
    lighthouse: {
      collect: {
        numberOfRuns: 3,
        settings: {
          chromeFlags: '--no-sandbox --headless'
        }
      },
      assert: {
        assertions: {
          'categories:accessibility': ['error', { minScore: 0.9 }],
          'categories:best-practices': ['error', { minScore: 0.9 }],
          'categories:performance': ['warn', { minScore: 0.8 }]
        }
      }
    }
  },

  // Test scenarios for different themes and states
  testScenarios: [
    {
      name: 'light-theme',
      setup: () => {
        document.documentElement.setAttribute('data-theme', 'light');
        document.documentElement.setAttribute('data-color-scheme', 'blue');
      }
    },
    {
      name: 'dark-theme',
      setup: () => {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.setAttribute('data-color-scheme', 'blue');
      }
    },
    {
      name: 'high-contrast',
      setup: () => {
        document.documentElement.classList.add('high-contrast');
      }
    },
    {
      name: 'reduced-motion',
      setup: () => {
        document.documentElement.classList.add('reduce-motion');
      }
    },
    {
      name: 'large-text',
      setup: () => {
        document.documentElement.classList.add('large-text');
      }
    }
  ],

  // Components to test
  components: [
    'enhanced-button',
    'enhanced-form-system',
    'enhanced-data-table',
    'widget-system',
    'accessibility-system',
    'loading-progress',
    'table-export-system'
  ]
};