'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, LogOut, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';

export function CustomUserDropdown({ isCompact }: { isCompact: boolean }) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative overflow-hidden rounded-full border border-white/10 transition-transform duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-white/20",
          isCompact ? "w-6 h-6" : "w-8 h-8 sm:w-8 sm:h-8"
        )}
      >
        {user.imageUrl ? (
          <Image 
            src={user.imageUrl} 
            alt={user.fullName || "User Avatar"} 
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-white">
            <UserIcon className="w-4 h-4" />
          </div>
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-neutral-900/80 backdrop-blur-2xl border border-white/10 shadow-2xl overflow-hidden z-50 origin-top-right"
          >
            {/* Header Profile Preview */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="relative w-10 h-10 rounded-full overflow-hidden border border-white/10 shrink-0">
                  {user.imageUrl ? (
                    <Image 
                      src={user.imageUrl} 
                      alt={user.fullName || "User Avatar"} 
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-800 flex items-center justify-center text-white">
                      <UserIcon className="w-5 h-5" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-medium text-white truncate">
                    {user.fullName || 'My Account'}
                  </span>
                  <span className="text-xs text-neutral-400 truncate">
                    {user.primaryEmailAddress?.emailAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Links & Actions */}
            <div className="p-2 flex flex-col gap-1">
              {/* <Link 
                href="/profile" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 rounded-xl hover:text-white hover:bg-white/10 transition-colors"
              >
                <UserIcon className="w-4 h-4" />
                Manage Account
              </Link> */}
              
              <Link 
                href="/profile" 
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-neutral-300 rounded-xl hover:text-white hover:bg-white/10 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </Link>

              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ redirectUrl: '/' });
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 rounded-xl hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            {/* <div className="p-2 border-t border-white/10">
              <button
                onClick={() => {
                  setIsOpen(false);
                  signOut({ redirectUrl: '/' });
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 rounded-xl hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div> */}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
