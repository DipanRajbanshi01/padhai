import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes safely (shadcn/ui convention). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an amount in NPR, e.g. 1499 -> "रू 1,499". */
export function formatNpr(amount: number): string {
  return `रू ${new Intl.NumberFormat("en-IN").format(amount)}`;
}
