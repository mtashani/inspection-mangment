/**
 * Theme Controls Addon Constants
 */

export const ADDON_ID = 'enhanced-theme-controls'
export const PANEL_ID = `${ADDON_ID}/panel`
export const TOOL_ID = `${ADDON_ID}/tool`

// Events
export const EVENTS = {
  THEME_CHANGED: `${ADDON_ID}/theme-changed`,
  VARIANT_CHANGED: `${ADDON_ID}/variant-changed`,
  RESET_THEME: `${ADDON_ID}/reset-theme`,
  EXPORT_THEME: `${ADDON_ID}/export-theme`,
  PERFORMANCE_REPORT: `${ADDON_ID}/performance-report`,
} as const