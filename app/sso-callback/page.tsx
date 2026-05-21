'use client';

import { useEffect } from 'react';
import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Command } from 'lucide-react';

/**
 * SSO Callback — Clerk redirects here after OAuth.
 * We finalize the session and push to /dashboard.
 */
export default function SSOCallbackPage() {
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  const router = useRouter();

  useEffect(() => {
    const finalize = async () => {
      try {
        if (signIn?.status === 'complete') {
          await signIn.finalize({
            navigate: ({ decorateUrl }) => {
              const url = decorateUrl('/dashboard');
              if (url.startsWith('http')) window.location.href = url;
              else router.push(url);
            },
          });
          return;
        }

        if (signUp?.status === 'complete') {
          await signUp.finalize({
            navigate: ({ decorateUrl }) => {
              const url = decorateUrl('/dashboard');
              if (url.startsWith('http')) window.location.href = url;
              else router.push(url);
            },
          });
          return;
        }

        // Fallback — Clerk may already handle the token automatically
        router.replace('/dashboard');
      } catch {
        router.replace('/');
      }
    };

    finalize();
  }, [signIn, signUp, router]);

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/10 flex items-center justify-center">
        <Command className="w-5 h-5 text-white" />
      </div>
      <p className="text-white/50 text-sm animate-pulse">Establishing connection…</p>
    </div>
  );
}
