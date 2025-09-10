"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

/**
 * Theme Provider Component
 * 
 * A simple wrapper around next-themes ThemeProvider that provides
 * theme switching functionality throughout the application.
 * 
 * Features:
 * - Light/Dark/System theme modes
 * - Automatic theme persistence in localStorage
 * - System preference detection
 * - Smooth theme transitions
 * 
 * @param children - React children to wrap with theme context
 * @param props - Additional props passed to NextThemesProvider
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}