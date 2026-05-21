'use client';

import React from 'react';
import { UserProfile } from '@clerk/nextjs';
import { dark } from '@clerk/ui/themes';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col relative overflow-hidden text-white font-sans selection:bg-white/30">
      {/* Background decorations for glassmorphism effect */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-purple-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] rounded-full bg-white/5 blur-[100px] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-neutral-950/50 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="p-2 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 transition-colors text-neutral-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-lg font-medium tracking-tight">Account Settings</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex justify-center items-start pt-12 pb-24 px-4 overflow-y-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-5xl"
        >
          {/* We wrap Clerk's UserProfile in a deeply customized container */}
          <div className="clerk-profile-wrapper rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-neutral-900/40 backdrop-blur-2xl ring-1 ring-white/5">
            <UserProfile 
              path="/profile"
              appearance={{
                // baseTheme: dark,
                variables: {
                  colorPrimary: '#3b82f6', // Bright Blue (Blue-500)
                  colorBackground: 'transparent',
                  colorForeground: '#ffffff',
                  colorMutedForeground: '#60a5fa', // Blue-400 (High visibility)
                  colorInput: 'rgba(255, 255, 255, 0.05)',
                  colorNeutral: 'rgba(255, 255, 255, 0.1)',
                  colorInputForeground: '#ffffff',
                  colorShimmer: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: '0.75rem',
                  fontFamily: 'inherit'
                },
                elements: {
                  rootBox: "w-full",
                  cardBox: "w-full max-w-none shadow-none border-none bg-transparent rounded-none",
                  navbar: "border-r border-white/5 bg-neutral-900/20 backdrop-blur-sm",
                  navbarButton: "text-blue-400 hover:text-white hover:bg-white/5 px-4 py-3 rounded-xl mx-2 my-1 transition-all duration-200",
                  navbarButton__active: "text-white bg-blue-500/20 border border-blue-500/30 px-4 py-3 rounded-xl mx-2 my-1 font-medium shadow-sm",
                  headerTitle: "text-2xl font-medium tracking-tight text-white",
                  headerSubtitle: "text-blue-400 mt-1",
                  profileSection: "border-b border-white/5 pb-8 mb-8",
                  profileSectionTitle: "text-lg font-medium text-white mb-6 tracking-tight",
                  profileSectionContent: "gap-6",
                  profileSectionPrimaryButton: "text-blue-400 hover:text-white hover:bg-white/10 transition-colors",
                  accordionTriggerButton: "hover:bg-white/5 rounded-xl transition-colors p-2 -ml-2",
                  badge: "bg-blue-500/20 border border-blue-500/30 text-blue-200 rounded-lg px-2.5 py-1 text-xs font-medium",
                  button: "bg-blue-600 text-white hover:bg-indigo-500 transition-colors rounded-xl shadow-md border border-blue-500/50",
                  button__danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20",
                  formButtonPrimary: "bg-blue-600 text-white hover:bg-blue-500",
                  formFieldInput: "bg-white/5 border-white/10 text-white rounded-xl focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all outline-none",
                  formFieldLabel: "text-blue-200 font-medium mb-1.5",
                  dividerRow: "border-white/5",
                  dividerLine: "bg-white/5",
                  avatarImageActionsUpload: "border border-white/10 hover:border-white/20 transition-colors bg-neutral-800/50",
                  scrollBox: "rounded-none",
                  pageScrollBox: "p-8",
                  navbarMobileMenuRow: "border-white/5",
                  navbarMobileMenuButton: "text-white hover:bg-white/5",
                }
              }}
            />
          </div>
        </motion.div>
      </main>

      {/* Global overrides to fix Clerk's forced widths and absolute text visibility */}
      <style dangerouslySetInnerHTML={{__html: `
        /* Force container to fill space */
        .clerk-profile-wrapper .cl-rootBox,
        .clerk-profile-wrapper .cl-cardBox {
          width: 100% !important;
          max-width: 100% !important;
        }

        /* Standardize padding */
        .clerk-profile-wrapper .cl-pageScrollBox {
          padding: 2rem !important;
        }
        @media (max-width: 768px) {
          .clerk-profile-wrapper .cl-pageScrollBox {
            padding: 1.5rem !important;
          }
        }

        /* --- NUCLEAR TEXT VISIBILITY --- */
        
        /* 1. Force EVERYTHING inside the wrapper to be white by default */
        .clerk-profile-wrapper * {
          color: #ffffff !important;
          opacity: 1 !important;
          border-color: rgba(255, 255, 255, 0.1) !important;
        }

        /* 2. Exceptions: Icons and SVGs should inherit color or be white */
        .clerk-profile-wrapper svg, 
        .clerk-profile-wrapper svg path {
          color: inherit !important;
          fill: currentColor !important;
        }

        /* 3. Blue Accents (Re-applying blue to specific elements that need contrast) */
        .clerk-profile-wrapper .cl-headerSubtitle,
        .clerk-profile-wrapper .cl-profileSectionSubtitle,
        .clerk-profile-wrapper .cl-userPreviewSecondaryIdentifier,
        .clerk-profile-wrapper .cl-formFieldDescription,
        .clerk-profile-wrapper .cl-breadcrumbsItem,
        .clerk-profile-wrapper .cl-formResendCodeLink,
        .clerk-profile-wrapper .cl-profileSectionPrimaryButton,
        .clerk-profile-wrapper .cl-accordionTriggerButton,
        .clerk-profile-wrapper .cl-badge,
        .clerk-profile-wrapper .cl-navbarButton {
          color: #60a5fa !important; /* Blue-400 */
        }

        /* 4. Hover states and Active states back to pure white for visibility */
        .clerk-profile-wrapper .cl-navbarButton[data-active="true"],
        .clerk-profile-wrapper .cl-navbarButton:hover,
        .clerk-profile-wrapper .cl-profileSectionPrimaryButton:hover,
        .clerk-profile-wrapper .cl-accordionTriggerButton:hover {
          color: #ffffff !important;
          background-color: rgba(59, 130, 246, 0.2) !important;
        }

        /* 5. Specific fix for input values vs labels */
        .clerk-profile-wrapper .cl-formFieldInput {
          color: #ffffff !important;
          background-color: rgba(255, 255, 255, 0.05) !important;
          border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .clerk-profile-wrapper .cl-formFieldLabel {
           color: #93c5fd !important; /* Blue-300 for better visibility than Blue-400 on small text */
           font-weight: 500 !important;
        }

        /* 6. Danger/Red states (MFA removal, etc.) */
        .clerk-profile-wrapper .cl-button__danger,
        .clerk-profile-wrapper .cl-formFieldError {
          color: #f87171 !important; /* Red-400 */
        }
        
        /* 7. Fix for any generic text blocks Clerk might use */
        .clerk-profile-wrapper .cl-text,
        .clerk-profile-wrapper .cl-formFieldInfoText,
        .clerk-profile-wrapper .cl-userPreviewMainIdentifier {
           color: #ffffff !important;
        }
      `}} />
    </div>
  );
}
