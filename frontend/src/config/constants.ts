// API URL Configuration
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Application Routes
export const ROUTES = {
  HOME: '/',
  CRANES: {
    DASHBOARD: '/cranes/dashboard',
    LIST: '/cranes',
    NEW: '/cranes/new',
    DETAIL: (id: number | string) => `/cranes/${id}`,
    INSPECTION_NEW: '/crane-inspections/new',
    SETTINGS: '/crane-settings'
  }
};

// Dashboard constants
export const REFRESH_INTERVAL = 300000; // 5 minutes

// File upload limits
export const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/pdf'
];