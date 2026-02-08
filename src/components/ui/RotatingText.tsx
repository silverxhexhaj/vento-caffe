"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface RotatingTextProps {
  words: string[];
  interval?: number;
  externalIndex?: number;
  onIndexChange?: (index: number) => void;
}

export function RotatingText({ words, interval = 2500, externalIndex, onIndexChange }: RotatingTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
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
  }, [words.length, interval]);

  // Auto-rotation timer
  useEffect(() => {
    startInterval();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }
    };
  }, [startInterval]);

  // Respond to external index jumps
  useEffect(() => {
    if (externalIndex !== undefined && externalIndex !== currentIndex) {
      setIsAnimating(true);
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
      animationTimeoutRef.current = setTimeout(() => {
        setCurrentIndex(externalIndex);
        setIsAnimating(false);
        animationTimeoutRef.current = null;
      }, 300);
      // Reset the auto-rotation timer so it starts fresh from this point
      startInterval();
    }
    // Only react to externalIndex changes, not currentIndex
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalIndex]);

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
