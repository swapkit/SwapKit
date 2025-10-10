"use client";

import { type DependencyList, useEffect } from "react";

export function useDebouncedEffect(effect: () => void, deps: DependencyList, delay: number) {
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps handling is different for "debounce" effect
  useEffect(() => {
    const handler = setTimeout(() => {
      effect();
    }, delay);

    return () => clearTimeout(handler);
  }, [...deps, delay]);
}
