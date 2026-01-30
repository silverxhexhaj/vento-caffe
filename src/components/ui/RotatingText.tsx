"use client";

import { useState, useEffect, useRef } from "react";

interface RotatingTextProps {
  words: string[];
  interval?: number;
  onIndexChange?: (index: number) => void;
}

export function RotatingText({ words, interval = 2500, onIndexChange }: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      animationTimeoutRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % words.length);
        setIsAnimating(false);
        animationTimeoutRef.current = null;
      }, 300);
    }, interval);

    return () => {
      clearInterval(timer);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [words.length, interval]);

  useEffect(() => {
    if (onIndexChange) {
      onIndexChange(currentIndex);
    }
  }, [currentIndex, onIndexChange]);

  return (
    <span className="inline-block relative italic">
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
