import type { Metadata } from "next"
import { Vazirmatn } from "next/font/google"
import "./globals.css"
import { Sidebar } from "@/components/layout/sidebar/sidebar"
import { MobileSidebar } from "@/components/layout/sidebar/mobile-sidebar"
import { SidebarProvider } from "@/contexts/sidebar-context"
import { TooltipProvider } from "@/components/ui/tooltip"

const vazirmatn = Vazirmatn({ subsets: ["arabic"] })

export const metadata: Metadata = {
  title: "Inspection System",
  description: "Inspection Management System",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr">
      <body className={vazirmatn.className}>
        <TooltipProvider>
          <SidebarProvider>
            <div className="flex min-h-screen">
              {/* Desktop Sidebar */}
              <div className="hidden md:block">
                <Sidebar />
              </div>

              {/* Mobile Sidebar */}
              <div className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-4 md:hidden">
                <MobileSidebar />
                <h1 className="font-semibold">Inspection System</h1>
              </div>

              {/* Main Content */}
              <main className="flex-1 md:ml-16">
                <div className="container px-4 py-6 md:px-6 md:py-8">
                  {children}
                </div>
              </main>
            </div>
          </SidebarProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
