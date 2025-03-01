'use client';

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function PSVLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const currentTab = pathname.split('/').pop();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">PSV Details</h1>
        <Link href="/psv" className="text-sm text-muted-foreground hover:text-primary">
          ← Back to PSV List
        </Link>
      </div>
      
      <Tabs value={currentTab || 'details'} className="w-full">
        <TabsList>
          <Link href={`/psv/${params.id}`}>
            <TabsTrigger value="details">Details</TabsTrigger>
          </Link>
          <Link href={`/psv/${params.id}/settings`}>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </Link>
          <Link href={`/psv/${params.id}/analytics`}>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </Link>
        </TabsList>
      </Tabs>

      {children}
    </div>
  );
}