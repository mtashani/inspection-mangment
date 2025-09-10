import '@testing-library/jest-dom'
import { configure } from '@testing-library/react'
import { vi } from 'vitest'

// Configure testing library
configure({ testIdAttribute: 'data-testid' })

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock navigator.clipboard
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockImplementation(() => Promise.resolve()),
    readText: vi.fn().mockImplementation(() => Promise.resolve('')),
  },
})

// Mock window.location
delete (window as any).location
window.location = {
  ...window.location,
  assign: vi.fn(),
  replace: vi.fn(),
  reload: vi.fn(),
  href: 'http://localhost:3000',
}

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}

// Mock fetch
global.fetch = vi.fn()

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1,
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}))

// Mock IndexedDB
const mockIDBRequest = {
  result: null,
  error: null,
  onsuccess: null,
  onerror: null,
}

const mockIDBDatabase = {
  transaction: vi.fn().mockReturnValue({
    objectStore: vi.fn().mockReturnValue({
      add: vi.fn().mockReturnValue(mockIDBRequest),
      get: vi.fn().mockReturnValue(mockIDBRequest),
      put: vi.fn().mockReturnValue(mockIDBRequest),
      delete: vi.fn().mockReturnValue(mockIDBRequest),
      getAll: vi.fn().mockReturnValue(mockIDBRequest),
      clear: vi.fn().mockReturnValue(mockIDBRequest),
    }),
  }),
  close: vi.fn(),
}

global.indexedDB = {
  open: vi.fn().mockReturnValue({
    ...mockIDBRequest,
    result: mockIDBDatabase,
  }),
  deleteDatabase: vi.fn().mockReturnValue(mockIDBRequest),
  databases: vi.fn().mockResolvedValue([]),
}

// Mock service worker
Object.defineProperty(navigator, 'serviceWorker', {
  value: {
    register: vi.fn().mockResolvedValue({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
    ready: Promise.resolve({
      installing: null,
      waiting: null,
      active: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
    controller: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  },
  writable: true,
})

// Mock online/offline events
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

// Mock toast notifications
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
  },
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock recharts
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => children,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  ScatterChart: ({ children }: any) => <div data-testid="scatter-chart">{children}</div>,
  AreaChart: ({ children }: any) => <div data-testid="area-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Scatter: () => <div data-testid="scatter" />,
  Area: () => <div data-testid="area" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Cell: () => <div data-testid="cell" />,
}))

export * from '@testing-library/react'
export { vi } from 'vitest'