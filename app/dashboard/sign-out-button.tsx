'use client';

import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function DashboardSignOut() {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => signOut(() => router.push('/'))}
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-white/50 hover:text-white hover:bg-white/10 transition-all border border-white/5"
    >
      <LogOut className="w-3.5 h-3.5" />
      Sign out
    </button>
  );
}
