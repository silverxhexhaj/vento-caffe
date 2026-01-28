"use client";

import { useState, useEffect } from "react";

interface RotatingTextProps {
  words: string[];
  interval?: number;
  onIndexChange?: (index: number) => void;
}

export function RotatingText({ words, interval = 2500, onIndexChange }: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      
      setTimeout(() => {
        setCurrentIndex((prev) => {
          const newIndex = (prev + 1) % words.length;
          onIndexChange?.(newIndex);
          return newIndex;
        });
        setIsAnimating(false);
      }, 300);
    }, interval);

    return () => clearInterval(timer);
  }, [words.length, interval, onIndexChange]);

  return (
    <span className="inline-block relative">
      <span
        className={`inline-block transition-all duration-300 ${
          isAnimating
            ? "opacity-0 translate-y-2"
            : "opacity-100 translate-y-0"
        }`}
      >
        {words[currentIndex]}
      </span>
    </span>
  );
}
