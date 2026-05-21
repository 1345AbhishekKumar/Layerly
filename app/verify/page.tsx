'use client';

import React, { useState } from 'react';
import { useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Command, Zap, AlertCircle, MailCheck } from 'lucide-react';

const globalStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600&display=swap');

  :root {
    --bg-base: #050505;
    --accent-1: rgba(99, 102, 241, 0.4);
    --accent-2: rgba(14, 165, 233, 0.4);
    --glass-bg: rgba(255, 255, 255, 0.03);
    --glass-border: rgba(255, 255, 255, 0.08);
  }

  body {
    background-color: var(--bg-base);
    color: white;
    font-family: 'Inter', sans-serif;
    margin: 0;
    overflow: hidden;
  }

  .mesh-bg {
    position: absolute;
    width: 200vw;
    height: 200vh;
    top: -50vh;
    left: -50vw;
    background:
      radial-gradient(circle at 50% 50%, var(--accent-1) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, var(--accent-2) 0%, transparent 40%);
    filter: blur(120px);
    opacity: 0.6;
    animation: slow-spin 30s linear infinite;
    pointer-events: none;
    z-index: 0;
  }

  @keyframes slow-spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  .glass-panel {
    background: var(--glass-bg);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid var(--glass-border);
    box-shadow: 0 4px 24px -1px rgba(0, 0, 0, 0.5), inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
  }

  .input-wrapper { position: relative; }

  .input-wrapper::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: 0.75rem;
    padding: 1px;
    background: linear-gradient(to bottom right, rgba(255,255,255,0.2), rgba(255,255,255,0.0));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    opacity: 0.5;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  .input-wrapper:focus-within::before {
    opacity: 1;
    background: linear-gradient(to bottom right, #6366f1, #0ea5e9);
  }

  .custom-input {
    background: rgba(0, 0, 0, 0.2);
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
    letter-spacing: 0.3em;
    text-align: center;
    font-size: 1.25rem;
    font-weight: 600;
  }

  @keyframes error-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .error-msg { animation: error-in 0.25s ease forwards; }

  .noise-overlay {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    pointer-events: none;
    z-index: 50;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  }
`;

export default function VerifyPage() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resent, setResent] = useState(false);

  const { signUp, errors, fetchStatus } = useSignUp();
  const router = useRouter();

  const isFetching = fetchStatus === 'fetching' || isLoading;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { error } = await signUp.verifications.verifyEmailCode({ code });
      if (error) { setIsLoading(false); return; }

      if (signUp.status === 'complete') {
        await signUp.finalize({
          navigate: ({ decorateUrl }) => {
            const url = decorateUrl('/dashboard');
            if (url.startsWith('http')) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          },
        });
      }
    } catch (err) {
      console.error('Verify error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await signUp.verifications.sendEmailCode();
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      console.error('Resend error:', err);
    }
  };

  const globalError = errors?.global?.[0]?.message ?? null;
  const codeError   = errors?.fields?.code?.message ?? null;

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505]">
      <style>{globalStyles}</style>
      <div className="noise-overlay" />
      <div className="mesh-bg" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-10 h-10 rounded-xl bg-white/10 glass-panel flex items-center justify-center">
            <Command className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-xl tracking-wide">NEXUS</span>
        </div>

        <div className="glass-panel p-8 sm:p-10 rounded-[2rem]">
          {/* Icon + heading */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mb-4">
              <MailCheck className="w-7 h-7 text-indigo-400" />
            </div>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-white">Verify Your Comms</h2>
            <p className="mt-2 text-sm text-white/40">
              We dispatched a 6-digit code to your email. Enter it below to activate your node.
            </p>
          </div>

          {/* Global error */}
          {globalError && (
            <div className="error-msg flex items-center gap-2 mb-5 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{globalError}</span>
            </div>
          )}

          {/* Resent confirmation */}
          {resent && (
            <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
              <MailCheck className="w-4 h-4 shrink-0" />
              <span>New code sent! Check your inbox.</span>
            </div>
          )}

          <form onSubmit={handleVerify} className="flex flex-col gap-5">
            <div className="input-wrapper">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                placeholder="— — — — — —"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                className="custom-input w-full block rounded-xl border-none py-4 px-4 text-white placeholder-white/20 focus:ring-0 focus:outline-none transition-all"
              />
            </div>
            {codeError && (
              <p className="error-msg text-xs text-red-400 -mt-2 pl-1">{codeError}</p>
            )}

            <button
              type="submit"
              disabled={isFetching || code.length < 6}
              className="group relative w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-white text-black font-semibold rounded-xl transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isFetching ? (
                <>
                  <Zap className="w-4 h-4 animate-pulse" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Activate Node</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleResend}
              disabled={isFetching}
              className="text-xs text-white/40 hover:text-white transition-colors disabled:opacity-50"
            >
              Didn&apos;t receive it? Resend code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
