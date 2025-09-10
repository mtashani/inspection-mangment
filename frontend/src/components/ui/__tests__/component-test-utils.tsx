import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AccessibilityProvider } from '../accessibility-preferences';
import { AriaLiveProvider } from '../accessibility-system';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Test wrapper with providers
export function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AccessibilityProvider>
      <AriaLiveProvider>
        {children}
      </AriaLiveProvider>
    </AccessibilityProvider>
  );
}

// Custom render function with providers
export function renderWithProviders(ui: React.ReactElement, options = {}) {
  return render(ui, {
    wrapper: TestWrapper,
    ...options
  });
}

// Accessibility testing utilities
export const a11yUtils = {
  // Test component for accessibility violations
  testAccessibility: async (component: React.ReactElement) => {
    const { container } = renderWithProviders(component);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  },

  // Test keyboard navigation
  testKeyboardNavigation: async (component: React.ReactElement, keys: string[]) => {
    const user = userEvent.setup();
    renderWithProviders(component);
    
    for (const key of keys) {
      await user.keyboard(key);
    }
  },

  // Test focus management
  testFocusManagement: async (component: React.ReactElement, expectedFocusedElement: string) => {
    renderWithProviders(component);
    const element = screen.getByRole(expectedFocusedElement) || screen.getByTestId(expectedFocusedElement);
    expect(element).toHaveFocus();
  }
};

// Performance testing utilities
export const performanceUtils = {
  // Measure render time
  measureRenderTime: async (component: React.ReactElement) => {
    const start = performance.now();
    renderWithProviders(component);
    const end = performance.now();
    return end - start;
  },

  // Test for memory leaks
  testMemoryLeaks: async (component: React.ReactElement, iterations = 100) => {
    const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    for (let i = 0; i < iterations; i++) {
      const { unmount } = renderWithProviders(component);
      unmount();
    }
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be minimal
    expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB
  }
};

// Theme testing utilities
export const themeUtils = {
  // Test component with different themes
  testWithThemes: async (component: React.ReactElement, themes: string[]) => {
    for (const theme of themes) {
      document.documentElement.setAttribute('data-theme', theme);
      const { unmount } = renderWithProviders(component);
      
      // Take snapshot for visual regression testing
      expect(document.body).toMatchSnapshot(`${theme}-theme`);
      
      unmount();
    }
  }
};

// Component testing templates
export const testTemplates = {
  // Basic component test
  basicComponent: (Component: React.ComponentType<any>, props: any = {}) => {
    describe(`${Component.displayName || Component.name}`, () => {
      it('renders without crashing', () => {
        renderWithProviders(<Component {...props} />);
      });

      it('has no accessibility violations', async () => {
        await a11yUtils.testAccessibility(<Component {...props} />);
      });

      it('matches snapshot', () => {
        const { container } = renderWithProviders(<Component {...props} />);
        expect(container.firstChild).toMatchSnapshot();
      });
    });
  },

  // Interactive component test
  interactiveComponent: (
    Component: React.ComponentType<any>, 
    props: any = {},
    interactions: Array<{ action: string; element: string; expected: string }>
  ) => {
    describe(`${Component.displayName || Component.name} - Interactive`, () => {
      it('handles user interactions correctly', async () => {
        const user = userEvent.setup();
        renderWithProviders(<Component {...props} />);

        for (const interaction of interactions) {
          const element = screen.getByRole(interaction.element) || screen.getByTestId(interaction.element);
          
          switch (interaction.action) {
            case 'click':
              await user.click(element);
              break;
            case 'type':
              await user.type(element, 'test input');
              break;
            case 'hover':
              await user.hover(element);
              break;
          }

          await waitFor(() => {
            expect(screen.getByText(interaction.expected)).toBeInTheDocument();
          });
        }
      });
    });
  }
};

export default {
  renderWithProviders,
  a11yUtils,
  performanceUtils,
  themeUtils,
  testTemplates
};