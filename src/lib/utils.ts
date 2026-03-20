import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 💰 Currency formatter
export const formatBirr = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "ETB",
    maximumFractionDigits: 2,
  }).format(amount);
};

// 📅 Date formatter
export const formatDate = (date?: string | null) => {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

// 🧾 Invoice number
export const generateInvoiceNumber = (id: string) => {
  return `INV-${id.slice(0, 8).toUpperCase()}`;
};