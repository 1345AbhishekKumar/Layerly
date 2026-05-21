"use client";

import React from "react";
import Image from "next/image";
import {
  X,
  Trash2,
  Download,
  Edit2,
  Command,
  ShieldAlert,
  Cpu,
  Sparkles,
  Loader2,
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";
import { GalleryImage } from "@/hooks/use-gallery";

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  onDelete: (id: string) => void;
  onEdit: (image: GalleryImage) => void;
  isLoading?: boolean;
}

export function GalleryModal({
  isOpen,
  onClose,
  images,
  onDelete,
  onEdit,
  isLoading,
}: GalleryModalProps) {
  const handleDownload = (dataUrl: string, createdAt: number) => {
    const link = document.createElement("a");

    link.download = `artifact-${createdAt}.jpg`;
    link.href = dataUrl;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const spring = {
    type: "spring" as const,
    stiffness: 260,
    damping: 24,
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] bg-black/90 backdrop-blur-3xl"
        >
          {/* BACKGROUND */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-[-10%] top-[-10%] h-[500px] w-[500px] rounded-full bg-indigo-500/15 blur-[120px]" />

            <div className="absolute bottom-[-10%] right-[-10%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[120px]" />

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] opacity-10" />
          </div>

          {/* CONTAINER */}
          <motion.div
            initial={{
              opacity: 0,
              scale: 0.96,
              y: 20,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 0.96,
              y: 20,
            }}
            transition={spring}
            className="relative flex h-full w-full flex-col"
          >
            {/* HEADER */}
            <div className="sticky top-0 z-50 border-b border-white/10 bg-black/30 backdrop-blur-2xl">
              <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
                <div className="flex items-center gap-5">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                    <Command className="h-7 w-7 text-white/80" />
                  </div>

                  <div>
                    <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                      Artifact Gallery
                    </h2>

                    <div className="mt-2 flex items-center gap-3">
                      <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-300">
                        Neural Archive
                      </span>

                      <span className="text-[10px] uppercase tracking-[0.3em] text-white/30">
                        {images.length} Assets Synced
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                >
                  CLOSE

                  <X className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90" />
                </button>
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-7xl px-6 py-10">
                {isLoading ? (
                  <div className="flex min-h-[70vh] flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500/50" />
                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                      Syncing Archive
                    </p>
                  </div>
                ) : images.length === 0 ? (
                  <div className="flex min-h-[70vh] flex-col items-center justify-center text-center">
                    <motion.div
                      animate={{
                        rotate: 360,
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 18,
                        ease: "linear",
                      }}
                      className="relative mb-10 flex h-36 w-36 items-center justify-center rounded-full border border-dashed border-white/10"
                    >
                      <Cpu className="h-12 w-12 text-white/10" />

                      <div className="absolute inset-0 rounded-full border-t border-indigo-500/30" />
                    </motion.div>

                    <h3 className="text-3xl font-bold text-white/70">
                      Gallery Empty
                    </h3>

                    <p className="mt-4 max-w-md text-sm leading-relaxed text-white/30">
                      Your generated images will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                      {images.map((img, index) => (
                        <motion.div
                          key={img.id}
                          layout
                          initial={{
                            opacity: 0,
                            y: 40,
                          }}
                          animate={{
                            opacity: 1,
                            y: 0,
                          }}
                          exit={{
                            opacity: 0,
                            scale: 0.9,
                          }}
                          transition={{
                            ...spring,
                            delay: index * 0.05,
                          }}
                          className="group"
                        >
                          {/* CARD */}
                          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-neutral-950 shadow-[0_30px_80px_rgba(0,0,0,0.65)] transition-all duration-500 hover:-translate-y-2 hover:border-white/20">
                            {/* IMAGE CONTAINER */}
                            <div className="relative aspect-[16/11] w-full overflow-hidden">
                              {/* IMAGE */}
                              <Image
                                src={img.dataUrl}
                                alt="Gallery"
                                draggable={false}
                                fill
                                unoptimized
                                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
                              />

                              {/* OVERLAY */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-80" />

                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_40%)] opacity-50" />

                              {/* TOP */}
                              <div className="absolute left-5 right-5 top-5 flex items-start justify-between">
                                <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 backdrop-blur-xl">
                                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">
                                    Artifact
                                  </span>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-xl">
                                  <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
                                    {new Date(
                                      img.createdAt
                                    ).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>

                              {/* BOTTOM */}
                              <div className="absolute inset-x-5 bottom-5">
                                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 backdrop-blur-2xl">
                                  <div className="mb-4 flex items-center justify-between">
                                    <div>
                                      <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                                        <Sparkles className="h-4 w-4 text-indigo-300" />
                                        Generated Asset
                                      </h3>

                                      <p className="mt-1 text-xs text-white/40">
                                        ID:{" "}
                                        {img.id.slice(0, 10).toUpperCase()}
                                      </p>
                                    </div>
                                  </div>

                                  {/* ACTIONS */}
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                      {img.canvasState && (
                                        <button
                                          onClick={() => onEdit(img)}
                                          className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition-all duration-300 hover:scale-105"
                                        >
                                          <Edit2 className="h-3.5 w-3.5" />
                                          Edit
                                        </button>
                                      )}

                                      <button
                                        onClick={() =>
                                          handleDownload(
                                            img.dataUrl,
                                            img.createdAt
                                          )
                                        }
                                        className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white"
                                      >
                                        <Download className="h-4 w-4" />
                                      </button>
                                    </div>

                                    <button
                                      onClick={() => onDelete(img.id)}
                                      className="rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-red-400/70 transition-all duration-300 hover:bg-red-500/10 hover:text-red-300"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* BORDER */}
                            <div className="pointer-events-none absolute inset-0 rounded-[32px] ring-1 ring-inset ring-white/10" />
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </div>

            {/* FOOTER */}
            <div className="border-t border-white/10 bg-black/20 backdrop-blur-2xl">
              <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-indigo-400 shadow-[0_0_20px_rgba(129,140,248,0.9)]" />

                  <p className="text-[11px] uppercase tracking-[0.25em] text-white/40">
                    Local Neural Storage Active
                  </p>
                </div>

                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                  <ShieldAlert className="h-3 w-3 text-white/20" />

                  <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/30">
                    Encrypted Session
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
