"use client";

import type { ReactNode } from "react";
import { MotionConfig } from "framer-motion";

export interface MotionProviderProps {
  children: ReactNode;
}

/**
 * Root provider Framer Motion.
 * `reducedMotion="user"` menghormati pengaturan prefers-reduced-motion perangkat.
 */
export function MotionProvider({ children }: MotionProviderProps) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
