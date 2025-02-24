'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const pathname = usePathname()

  return (
    <nav className="border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Inspection Management</h1>
          <div className="flex gap-4">
            <Button
              variant={pathname === '/equipment' ? 'default' : 'ghost'}
              asChild
            >
              <Link href="/equipment">Equipment</Link>
            </Button>
            <Button
              variant={pathname === '/daily-reports' ? 'default' : 'ghost'}
              asChild
            >
              <Link href="/daily-reports">Daily Reports</Link>
            </Button>
            <Button
              variant={pathname === '/psv' ? 'default' : 'ghost'}
              asChild
            >
              <Link href="/psv">PSV Management</Link>
            </Button>
            <Button
              variant={pathname === '/psv-analytics' ? 'default' : 'ghost'}
              asChild
            >
              <Link href="/psv-analytics">PSV Analytics</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}