import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number or numeric string to Malaysian Ringgit format: RM 80.00
 * Handles null, undefined, strings, and numbers with two decimal places.
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || amount === "") {
    return "RM 0.00";
  }
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numeric)) {
    return "RM 0.00";
  }
  return `RM ${numeric.toLocaleString("en-MY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Format a date string or Date object to DD/MM/YYYY format: 24/09/2026
 * Handles YYYY-MM-DD directly to prevent timezone shift issues.
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) {
    return "-";
  }

  // Handle YYYY-MM-DD strings directly to prevent timezone offset shifts
  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    const [year, month, day] = date.split("-");
    return `${day}/${month}/${year}`;
  }

  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) {
    return "-";
  }

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
