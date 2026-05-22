"use client";

import React, { useState } from "react";
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
  Maximize2,
  Search,
  ArrowUpDown,
  Filter,
  CheckSquare,
  Square,
  Check,
} from "lucide-react";

import { motion, AnimatePresence } from "motion/react";
import { GalleryImage } from "@/hooks/use-gallery";

interface GalleryModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: GalleryImage[];
  onDelete: (id: string | string[]) => void;
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
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);

  // SEARCH, FILTER, SORT STATE
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [filterBy, setFilterBy] = useState<"all" | "editable">("all");

  // SELECTION STATE
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredImages = images
    .filter((img) => {
      const matchesSearch =
        img.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        new Date(img.createdAt)
          .toLocaleDateString()
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      const matchesFilter = filterBy === "all" || !!img.canvasState;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return b.createdAt - a.createdAt;
      return a.createdAt - b.createdAt;
    });

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    onDelete(selectedIds);
    setSelectedIds([]);
    setIsSelectionMode(false);
  };

  const handleBulkDownload = () => {
    selectedIds.forEach((id) => {
      const img = images.find((i) => i.id === id);
      if (img) {
        handleDownload(img.dataUrl, img.createdAt);
      }
    });
  };

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

                <div className="flex items-center gap-4">
                  <button
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode);
                      setSelectedIds([]);
                    }}
                    className={`flex items-center gap-3 rounded-2xl border px-5 py-3 text-sm font-bold transition-all duration-300 ${
                      isSelectionMode
                        ? "border-indigo-500/50 bg-indigo-500/10 text-indigo-300"
                        : "border-white/10 bg-white/[0.04] text-white/60 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                    }`}
                  >
                    {isSelectionMode ? (
                      <>
                        CANCEL SELECT
                        <X className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        SELECT ASSETS
                        <CheckSquare className="h-4 w-4" />
                      </>
                    )}
                  </button>

                  <button
                    onClick={onClose}
                    className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/60 transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
                  >
                    CLOSE
                    <X className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90" />
                  </button>
                </div>
              </div>
            </div>

            {/* TOOLBAR */}
            <div className="border-b border-white/5 bg-black/20 py-4 backdrop-blur-xl">
              <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-6 px-6">
                {/* SEARCH */}
                <div className="relative flex-1 min-w-[300px]">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <input
                    type="text"
                    placeholder="Search by ID or Date..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/[0.03] py-3 pl-12 pr-4 text-sm text-white outline-none transition-all focus:border-indigo-500/50 focus:bg-white/[0.06]"
                  />
                </div>

                <div className="flex items-center gap-3">
                  {/* FILTER */}
                  <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                    <button
                      onClick={() => setFilterBy("all")}
                      className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        filterBy === "all"
                          ? "bg-white text-black"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setFilterBy("editable")}
                      className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest transition-all ${
                        filterBy === "editable"
                          ? "bg-white text-black"
                          : "text-white/40 hover:text-white"
                      }`}
                    >
                      Editable
                    </button>
                  </div>

                  {/* SORT */}
                  <button
                    onClick={() =>
                      setSortBy(sortBy === "newest" ? "oldest" : "newest")
                    }
                    className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-white/60 transition-all hover:border-white/20 hover:text-white"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    {sortBy === "newest" ? "Newest" : "Oldest"}
                  </button>
                </div>
              </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 overflow-y-auto">
              <div className="mx-auto max-w-7xl px-6 py-10 pb-32">
                {isLoading ? (
                  <div className="flex min-h-[70vh] flex-col items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-indigo-500/50" />
                    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-white/20">
                      Syncing Archive
                    </p>
                  </div>
                ) : filteredImages.length === 0 ? (
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
                      {images.length === 0 ? "Gallery Empty" : "No Assets Found"}
                    </h3>

                    <p className="mt-4 max-w-md text-sm leading-relaxed text-white/30">
                      {images.length === 0
                        ? "Your generated images will appear here."
                        : "Try adjusting your search or filter settings."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 xl:grid-cols-3">
                    <AnimatePresence mode="popLayout">
                      {filteredImages.map((img, index) => (
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
                          className="group cursor-pointer"
                          onClick={() => isSelectionMode && toggleSelection(img.id)}
                        >
                          {/* CARD */}
                          <div
                            className={`relative overflow-hidden rounded-[32px] border transition-all duration-500 hover:-translate-y-2 ${
                              selectedIds.includes(img.id)
                                ? "border-indigo-500 shadow-[0_0_40px_rgba(99,102,241,0.3)]"
                                : "border-white/10 bg-neutral-950 shadow-[0_30px_80px_rgba(0,0,0,0.65)] hover:border-white/20"
                            }`}
                          >
                            {/* IMAGE CONTAINER */}
                            <div className="relative aspect-[16/11] w-full overflow-hidden">
                              {/* SELECTION OVERLAY */}
                              {isSelectionMode && (
                                <div
                                  className={`absolute inset-0 z-20 flex items-center justify-center transition-all duration-300 ${
                                    selectedIds.includes(img.id)
                                      ? "bg-indigo-500/20"
                                      : "bg-black/0 group-hover:bg-black/20"
                                  }`}
                                >
                                  <div
                                    className={`flex h-12 w-12 items-center justify-center rounded-2xl border transition-all duration-300 ${
                                      selectedIds.includes(img.id)
                                        ? "scale-110 border-indigo-500 bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]"
                                        : "border-white/20 bg-black/40 text-transparent group-hover:border-white/40"
                                    }`}
                                  >
                                    <Check className="h-6 w-6" />
                                  </div>
                                </div>
                              )}

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
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-80" />

                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_40%)] opacity-0 transition-opacity duration-500 group-hover:opacity-50" />

                              {/* TOP */}
                              <div className="absolute left-5 right-5 top-5 z-30 flex items-start justify-between opacity-0 transition-all duration-500 translate-y-[-10px] group-hover:opacity-100 group-hover:translate-y-0">
                                <div className="rounded-full border border-white/10 bg-black/30 px-3 py-1 backdrop-blur-xl">
                                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/70">
                                    Artifact
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <div className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-xl">
                                    <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/60">
                                      {new Date(
                                        img.createdAt
                                      ).toLocaleDateString()}
                                    </p>
                                  </div>

                                  {!isSelectionMode && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedImage(img);
                                      }}
                                      className="rounded-xl border border-white/10 bg-white/10 p-2 backdrop-blur-xl transition-all duration-300 hover:bg-white/20 hover:text-white"
                                    >
                                      <Maximize2 className="h-4 w-4 text-white/70" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* BOTTOM */}
                              <div className="absolute inset-x-5 bottom-5 z-30 opacity-0 transition-all duration-500 translate-y-[10px] group-hover:opacity-100 group-hover:translate-y-0">
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
                                  {!isSelectionMode && (
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2">
                                        {img.canvasState && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onEdit(img);
                                            }}
                                            className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-xs font-black uppercase tracking-[0.2em] text-black transition-all duration-300 hover:scale-105"
                                          >
                                            <Edit2 className="h-3.5 w-3.5" />
                                            Edit
                                          </button>
                                        )}

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleDownload(
                                              img.dataUrl,
                                              img.createdAt
                                            );
                                          }}
                                          className="rounded-xl border border-white/10 bg-white/[0.05] p-3 text-white/70 transition-all duration-300 hover:bg-white/10 hover:text-white"
                                        >
                                          <Download className="h-4 w-4" />
                                        </button>
                                      </div>

                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDelete(img.id);
                                        }}
                                        className="rounded-xl border border-red-500/10 bg-red-500/5 p-3 text-red-400/70 transition-all duration-300 hover:bg-red-500/10 hover:text-red-300"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  )}
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

            {/* BULK ACTION BAR */}
            <AnimatePresence>
              {isSelectionMode && selectedIds.length > 0 && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  className="fixed bottom-10 left-1/2 z-50 -translate-x-1/2"
                >
                  <div className="flex items-center gap-6 rounded-[32px] border border-indigo-500/30 bg-black/60 px-8 py-4 backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                        Selected Assets
                      </span>
                      <span className="text-2xl font-bold text-white">
                        {selectedIds.length}
                      </span>
                    </div>

                    <div className="h-10 w-px bg-white/10" />

                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleBulkDownload}
                        className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.05] px-6 py-3 text-xs font-bold text-white transition-all hover:bg-white/10"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>

                      <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 rounded-2xl bg-red-500 px-6 py-3 text-xs font-bold text-white transition-all hover:scale-105 hover:bg-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsSelectionMode(false);
                        setSelectedIds([]);
                      }}
                      className="ml-2 rounded-full p-2 text-white/40 transition-all hover:bg-white/5 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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

          {/* LIGHTBOX */}
          <AnimatePresence>
            {selectedImage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/95 p-4 md:p-10"
                onClick={() => setSelectedImage(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="relative max-h-full max-w-full overflow-hidden rounded-3xl border border-white/10 bg-neutral-900 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <img
                    src={selectedImage.dataUrl}
                    alt="Preview"
                    className="max-h-[85vh] w-auto object-contain"
                  />

                  {/* LIGHTBOX ACTIONS */}
                  <div className="flex items-center justify-between border-t border-white/10 bg-black/40 p-4 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() =>
                          handleDownload(
                            selectedImage.dataUrl,
                            selectedImage.createdAt
                          )
                        }
                        className="flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-black transition-all hover:scale-105"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>

                      {selectedImage.canvasState && (
                        <button
                          onClick={() => {
                            onEdit(selectedImage);
                            setSelectedImage(null);
                          }}
                          className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-black uppercase tracking-[0.2em] text-white/70 transition-all hover:bg-white/10 hover:text-white"
                        >
                          <Edit2 className="h-4 w-4" />
                          Edit Asset
                        </button>
                      )}
                    </div>

                    <button
                      onClick={() => setSelectedImage(null)}
                      className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/70 transition-all hover:bg-white/10 hover:text-white"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
