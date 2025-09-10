/**
 * Theme Controls Addon Registration
 * Registers the enhanced theme controls addon with Storybook
 */

import { addons, types } from '@storybook/manager-api'
import { ADDON_ID, PANEL_ID, TOOL_ID } from './constants'
import { ThemeControlsPanel } from './ThemeControlsPanel'
import { ThemeControlsTool } from './ThemeControlsTool'

// Register the addon
addons.register(ADDON_ID, () => {
  // Register the panel
  addons.add(PANEL_ID, {
    type: types.PANEL,
    title: 'Theme Controls',
    match: ({ viewMode }) => viewMode === 'story',
    render: ThemeControlsPanel,
  })
  
  // Register the toolbar tool
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: 'Theme System',
    match: ({ viewMode }) => viewMode === 'story',
    render: ThemeControlsTool,
  })
})