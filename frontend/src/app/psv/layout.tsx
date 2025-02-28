'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navigationItems = [
  {
    title: "PSV List",
    href: "/psv",
  },
  {
    title: "Settings",
    href: "/psv-settings",
  },
  {
    title: "Analytics",
    href: "/psv-analytics",
  },
];

interface PSVLayoutProps {
  children: React.ReactNode;
}

export default function PSVLayout({ children }: PSVLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">PSV Management</h2>
          <p className="text-muted-foreground">
            Manage and monitor pressure safety valves
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <nav className="flex space-x-2 border-b">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium transition-colors hover:text-primary",
                pathname === item.href
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {item.title}
            </Link>
          ))}
        </nav>

        <div>
          {children}
        </div>
      </div>
    </div>
  );
}