"use client";

import { useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryLightboxProps {
  images: { src: string; caption?: string; phase?: string; date?: string }[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

export default function GalleryLightbox({ images, currentIndex, onClose, onPrev, onNext }: GalleryLightboxProps) {
  const current = images[currentIndex];

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case "Escape": onClose(); break;
      case "ArrowLeft": onPrev(); break;
      case "ArrowRight": onNext(); break;
    }
  }, [onClose, onPrev, onNext]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  if (!current) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white z-10 transition-colors">
        <X className="w-8 h-8" />
      </button>

      <button onClick={(e) => { e.stopPropagation(); onPrev(); }} className="absolute left-4 p-2 text-white/70 hover:text-white transition-colors z-10">
        <ChevronLeft className="w-10 h-10" />
      </button>

      <div className="flex flex-col items-center max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <img src={current.src} alt={current.caption || ""} className="max-w-full max-h-[80vh] object-contain rounded-lg" />
        <div className="mt-4 text-center">
          {current.phase && <span className="inline-block text-xs font-bold text-mhma-gold uppercase tracking-wider mb-1">{current.phase}</span>}
          {current.caption && <p className="text-white/80 text-sm">{current.caption}</p>}
          {current.date && <p className="text-white/50 text-xs mt-1">{current.date}</p>}
          <p className="text-white/40 text-xs mt-2">{currentIndex + 1} / {images.length}</p>
        </div>
      </div>

      <button onClick={(e) => { e.stopPropagation(); onNext(); }} className="absolute right-4 p-2 text-white/70 hover:text-white transition-colors z-10">
        <ChevronRight className="w-10 h-10" />
      </button>
    </div>
  );
}
