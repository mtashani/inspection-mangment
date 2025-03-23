'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PSVRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/psv-layout/psv');
  }, [router]);

  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <h2 className="text-xl font-medium">Redirecting to PSV Management...</h2>
        <div className="mt-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    </div>
  );
}