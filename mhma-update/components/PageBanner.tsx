import React from "react";

interface PageBannerProps {
  title: string;
  subtitle?: string;
  highlightedText?: string;
  badgeText?: string;
  currentPage?: string;
}

export default function PageBanner({
  title,
  subtitle,
  highlightedText,
  badgeText,
  currentPage
}: PageBannerProps) {
  return (
    <section className="relative pt-32 pb-20 md:pt-36 md:pb-24 lg:pt-44 lg:pb-28 overflow-hidden mhma-gradient mhma-pattern">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-10 right-10 w-64 h-64 bg-amber-400/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 left-10 w-32 h-32 bg-amber-400/10 rounded-full blur-2xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        {badgeText && (
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-amber-400/30 bg-amber-400/10 backdrop-blur-sm text-amber-400 text-xs font-bold tracking-widest uppercase">
            {badgeText}
          </div>
        )}
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 font-serif uppercase tracking-tight">
          {title.split(' ').map((word, i) =>
            word === highlightedText ? (
              <span key={i} className="text-amber-400 italic"> {word}</span>
            ) : (
              <span key={i}> {word}</span>
            )
          )}
        </h1>
        {subtitle && (
          <p className="text-xl text-gray-200 max-w-2xl mx-auto font-light leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
    </section>
  );
}
