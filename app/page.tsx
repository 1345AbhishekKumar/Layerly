'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSignIn, useSignUp, useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  // Github,
  Mail,
  Lock,
  User,
  Command,
  Zap,
  ArrowUpRight,
  AlertCircle,
} from 'lucide-react';

// ─── Global Styles ───────────────────────────────────────────────────────────
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

  h1, h2, h3, .font-display {
    font-family: 'Space Grotesk', sans-serif;
  }

  .noise-overlay {
    position: fixed;
    top: 0; left: 0; width: 100vw; height: 100vh;
    pointer-events: none;
    z-index: 50;
    opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
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
    box-shadow:
      0 4px 24px -1px rgba(0, 0, 0, 0.5),
      inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
  }

  .input-wrapper {
    position: relative;
    transition: all 0.3s ease;
  }

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
  }

  .custom-input:-webkit-autofill {
    -webkit-box-shadow: 0 0 0 30px #0a0a0a inset !important;
    -webkit-text-fill-color: white !important;
  }

  .btn-shimmer {
    position: relative;
    overflow: hidden;
  }

  .btn-shimmer::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(to bottom right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%);
    transform: rotate(45deg) translateY(-100%);
    transition: transform 0.6s ease;
  }

  .btn-shimmer:hover::after {
    transform: rotate(45deg) translateY(100%);
  }

  /* Clerk CAPTCHA widget styling override */
  #clerk-captcha {
    margin-top: 16px;
  }

  /* Error message animation */
  @keyframes error-in {
    from { opacity: 0; transform: translateY(-4px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .error-msg {
    animation: error-in 0.25s ease forwards;
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHoveringPanel, setIsHoveringPanel] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Form fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');

  // Clerk Core 3 hooks
  const { signIn, errors: signInErrors, fetchStatus: signInFetch } = useSignIn();
  const { signUp, errors: signUpErrors, fetchStatus: signUpFetch } = useSignUp();
  const router = useRouter();

  // Unified loading state driven by Clerk's fetchStatus
  const isFetching = signInFetch === 'fetching' || signUpFetch === 'fetching' || isLoading;

  // ── Mouse tracking ───────────────────────────────────────────────────────
  const [mouseState, setMouseState] = useState({ x: 0, y: 0, px: 0, py: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      let px = 0;
      let py = 0;
      if (panelRef.current) {
        const rect = panelRef.current.getBoundingClientRect();
        px = e.clientX - rect.left;
        py = e.clientY - rect.top;
      }
      setMouseState({ x: e.clientX, y: e.clientY, px, py });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const { x: mouseX, y: mouseY, px: panelX, py: panelY } = mouseState;

  // ── Clear errors when switching mode ────────────────────────────────────
  const handleToggleMode = (login: boolean) => {
    setIsLogin(login);
    setFullName('');
    setEmail('');
    setPassword('');
    signIn?.reset?.();
    signUp?.reset?.();
  };

  // ── Primary form submit ──────────────────────────────────────────────────
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // ── Sign In ───────────────────────────────────────────────────────
        const { error } = await signIn.password({
          identifier: email,
          password,
        });

        if (error) { setIsLoading(false); return; }

        if (signIn.status === 'complete') {
          await signIn.finalize({
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
      } else {
        // ── Sign Up ───────────────────────────────────────────────────────
        const nameParts  = fullName.trim().split(' ');
        const firstName  = nameParts[0] ?? '';
        const lastName   = nameParts.slice(1).join(' ') || undefined;

        const { error } = await signUp.password({
          emailAddress: email,
          password,
          firstName,
          ...(lastName && { lastName }),
        });

        if (error) { setIsLoading(false); return; }

        // Send email verification code
        await signUp.verifications.sendEmailCode();
        router.push('/verify');
      }
    } catch (err) {
      console.error('Auth error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── SSO (GitHub / Google) ────────────────────────────────────────────────
  const handleSSO = async (strategy: 'oauth_github' | 'oauth_google') => {
    try {
      if (isLogin) {
        await signIn.sso({
          strategy,
          redirectUrl: '/sso-callback',
          redirectCallbackUrl: '/sso-callback',
        });
      } else {
        await signUp.sso({
          strategy,
          redirectUrl: '/sso-callback',
          redirectCallbackUrl: '/sso-callback',
        });
      }
    } catch (err) {
      console.error('SSO error:', err);
    }
  };

  // ── Collect visible error messages ───────────────────────────────────────
  const errors = isLogin ? signInErrors : signUpErrors;
  const globalError = errors?.global?.[0]?.message ?? null;
  const emailError  = isLogin
    ? (signInErrors?.fields?.identifier?.message ?? null)
    : (signUpErrors?.fields?.emailAddress?.message ?? null);
  const passwordError = errors?.fields?.password?.message ?? null;
  const nameError     = !isLogin ? (signUpErrors?.fields?.firstName?.message ?? null) : null;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#050505] selection:bg-indigo-500/30">
      <style>{globalStyles}</style>

      {/* ── Background Elements ── */}
      <div className="noise-overlay" />
      <div className="mesh-bg" />

      {/* ── Cursor Orb ── */}
      <div
        className="fixed rounded-full pointer-events-none blur-[100px] z-0 transition-opacity duration-500"
        style={{
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, rgba(14,165,233,0.8) 0%, rgba(99,102,241,0.4) 50%, transparent 100%)',
          transform: `translate(${mouseX - 200}px, ${mouseY - 200}px)`,
          opacity: isHoveringPanel ? 0.6 : 0.2,
        }}
      />

      {/* ── Main Layout ── */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center min-h-screen">

        {/* ── Left Column: Branding ── */}
        <div className="hidden lg:flex flex-col justify-center h-full relative">
          <div className="mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 glass-panel flex items-center justify-center">
              <Command className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-xl tracking-wide">NEXUS</span>
          </div>

          <div className="relative">
            <h1 className="font-display text-7xl xl:text-8xl font-bold tracking-tighter leading-[0.9] text-transparent bg-clip-text bg-gradient-to-br from-white via-white/80 to-white/20">
              Beyond.<br />
              <span className="italic font-light opacity-80">Logic.</span>
            </h1>
            <div className="absolute -left-8 top-4 w-[2px] h-full bg-gradient-to-b from-indigo-500/50 via-sky-500/20 to-transparent" />
          </div>

          <p className="mt-8 text-lg text-white/50 max-w-md font-light leading-relaxed">
            Enter the architecture of tomorrow. Authenticate to access your unified command center and shape the digital frontier.
          </p>

          <div className="mt-12 flex items-center gap-6">
            <div className="flex -space-x-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full border-2 border-[#050505] bg-gradient-to-br from-white/20 to-white/5 glass-panel flex items-center justify-center text-xs text-white/50 font-medium"
                >
                  {i === 1 ? 'JD' : i === 2 ? 'AK' : '++'}
                </div>
              ))}
            </div>
            <p className="text-sm text-white/40 font-medium">Join 10,000+ pioneers</p>
          </div>
        </div>

        {/* ── Right Column: Auth Panel ── */}
        <div className="flex justify-center lg:justify-end w-full relative">
          <div
            ref={panelRef}
            onMouseEnter={() => setIsHoveringPanel(true)}
            onMouseLeave={() => setIsHoveringPanel(false)}
            className="w-full max-w-md relative z-20"
          >
            {/* Cursor glow over panel */}
            <div
              className="absolute inset-0 z-0 transition-opacity duration-300 pointer-events-none rounded-3xl"
              style={{
                opacity: isHoveringPanel ? 1 : 0,
                background: `radial-gradient(600px circle at ${panelX}px ${panelY}px, rgba(255,255,255,0.06), transparent 40%)`,
              }}
            />

            <div className="glass-panel p-8 sm:p-10 rounded-[2rem] relative z-10 overflow-hidden group">

              {/* ── Header / Mode Toggle ── */}
              <div className="flex items-center justify-between mb-10">
                {/* Sliding title */}
                <div className="relative h-8 w-48 overflow-hidden">
                  <h2
                    className="font-display text-2xl font-semibold tracking-tight text-white absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{
                      transform: isLogin ? 'translateY(0)' : 'translateY(-100%)',
                      opacity: isLogin ? 1 : 0,
                    }}
                  >
                    Access Node
                  </h2>
                  <h2
                    className="font-display text-2xl font-semibold tracking-tight text-white absolute inset-0 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{
                      transform: isLogin ? 'translateY(100%)' : 'translateY(0)',
                      opacity: isLogin ? 0 : 1,
                    }}
                  >
                    Initialize Node
                  </h2>
                </div>

                {/* Segmented control */}
                <div className="flex items-center p-1 bg-black/40 rounded-full border border-white/5 relative shadow-inner">
                  <div
                    className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/10 rounded-full shadow-sm transition-all duration-300 ease-out"
                    style={{ left: isLogin ? '4px' : 'calc(50%)' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleToggleMode(true)}
                    className={`relative z-10 px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${isLogin ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                  >
                    Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleMode(false)}
                    className={`relative z-10 px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${!isLogin ? 'text-white' : 'text-white/40 hover:text-white/70'}`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>

              {/* ── Global Error Banner ── */}
              {globalError && (
                <div className="error-msg flex items-center gap-2 mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{globalError}</span>
                </div>
              )}

              {/* ── Form ── */}
              <form onSubmit={handleAuth} className="flex flex-col relative">

                {/* Sign Up Name field (slides in/out) */}
                <div
                  className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isLogin ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}
                >
                  <div className="overflow-hidden">
                    <div className="input-wrapper group mb-5">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <User className="w-5 h-5 text-white/30 group-focus-within:text-white/80 transition-colors" />
                      </div>
                      <input
                        type="text"
                        placeholder="Ident (Full Name)"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="custom-input w-full block rounded-xl border-none py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/30 focus:ring-0 focus:outline-none transition-all"
                        tabIndex={isLogin ? -1 : 0}
                      />
                    </div>
                    {nameError && (
                      <p className="error-msg text-xs text-red-400 -mt-3 mb-4 pl-1">{nameError}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div className="input-wrapper group mb-5">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-white/30 group-focus-within:text-white/80 transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="Comms Link (Email)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="custom-input w-full block rounded-xl border-none py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/30 focus:ring-0 focus:outline-none transition-all"
                  />
                </div>
                {emailError && (
                  <p className="error-msg text-xs text-red-400 -mt-3 mb-4 pl-1">{emailError}</p>
                )}

                {/* Password */}
                <div className="input-wrapper group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="w-5 h-5 text-white/30 group-focus-within:text-white/80 transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="Cipher (Password)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="custom-input w-full block rounded-xl border-none py-3.5 pl-12 pr-4 text-sm text-white placeholder-white/30 focus:ring-0 focus:outline-none transition-all"
                  />
                </div>
                {passwordError && (
                  <p className="error-msg text-xs text-red-400 mt-1 pl-1">{passwordError}</p>
                )}

                {/* Forgot cipher (login only, slides in) */}
                <div
                  className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isLogin ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                >
                  <div className="overflow-hidden">
                    <div className="flex justify-end pt-3 pb-1">
                      <a
                        href="#"
                        className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1 group"
                      >
                        Forgot cipher?
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Clerk CAPTCHA — required for sign-up bot protection */}
                <div
                  className={`grid transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isLogin ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'}`}
                >
                  <div className="overflow-hidden">
                    {/* Clerk mounts the CAPTCHA widget here automatically */}
                    <div id="clerk-captcha" />
                  </div>
                </div>

                {/* Submit CTA */}
                <button
                  type="submit"
                  disabled={isFetching}
                  className="btn-shimmer group relative w-full flex items-center justify-center gap-2 mt-4 py-3.5 px-4 bg-white text-black font-semibold rounded-xl transition-all hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black focus:ring-white disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isFetching ? (
                    <div className="flex items-center gap-2 h-6">
                      <Zap className="w-4 h-4 animate-pulse" />
                      <span>Processing...</span>
                    </div>
                  ) : (
                    <div className="relative flex items-center justify-center w-full h-6 overflow-hidden">
                      {/* Login label */}
                      <div
                        className="absolute flex items-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{
                          transform: isLogin ? 'translateY(0)' : 'translateY(-150%)',
                          opacity: isLogin ? 1 : 0,
                        }}
                      >
                        <span>Establish Connection</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                      {/* Sign Up label */}
                      <div
                        className="absolute flex items-center gap-2 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
                        style={{
                          transform: isLogin ? 'translateY(150%)' : 'translateY(0)',
                          opacity: isLogin ? 0 : 1,
                        }}
                      >
                        <span>Create Identity</span>
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  )}
                </button>
              </form>

              {/* ── Divider ── */}
              <div className="mt-8 mb-6 flex items-center">
                <div className="flex-grow h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <span className="px-4 text-xs text-white/30 font-medium tracking-wider uppercase">Or connect via</span>
                <div className="flex-grow h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              </div>

              {/* ── Social Logins ── */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleSSO('oauth_github')}
                  disabled={isFetching}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl glass-panel hover:bg-white/10 transition-all text-sm font-medium text-white/80 hover:text-white group border-white/5 hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {/* <Github className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" /> */}
                  GitHub
                </button>

                <button
                  type="button"
                  onClick={() => handleSSO('oauth_google')}
                  disabled={isFetching}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl glass-panel hover:bg-white/10 transition-all text-sm font-medium text-white/80 hover:text-white group border-white/5 hover:border-white/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {/* Google SVG */}
                  <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Google
                </button>
              </div>
            </div>

            {/* Decorative orb behind panel */}
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full z-0 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
