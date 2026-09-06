import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

let counter = 0;
export function generateId(prefix: string): string {
  counter += 1;
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${counter}_${randomPart}`;
}
