import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function countWords(value: string) {
  const normalizedValue = value.trim();

  return normalizedValue ? normalizedValue.split(/\s+/u).length : 0;
}

export function countCharacters(value: string) {
  return Array.from(value).length;
}
