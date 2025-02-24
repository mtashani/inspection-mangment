'use client'

import { InspectorsProvider } from "@/contexts/inspectors-context"

export default function DailyReportsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <InspectorsProvider>
      {children}
    </InspectorsProvider>
  )
}