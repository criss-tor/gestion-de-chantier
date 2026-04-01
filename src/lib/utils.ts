import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convertit des heures décimales en format H:MM
 * Ex: 8.5 -> "8:30", 2.25 -> "2:15"
 */
export function formatHoursDecimal(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Convertit des heures décimales en format HhMM
 * Ex: 8.5 -> "8h30", 2.25 -> "2h15"
 */
export function formatHoursDecimalWithH(decimalHours: number): string {
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
}
