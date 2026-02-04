import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names with support for strings, arrays, falsy values,
 * and objects of the form { [className]: boolean }.
 * Uses tailwind-merge to resolve Tailwind class conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
