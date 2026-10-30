import { RateType } from "@/types/employee";

/**
 * Calculates the base hourly rate for an employee given their daily/base rate and rate type.
 * Assumes a standard 8-hour workday, 6-day work week, or 26-day work month.
 */
export function calculateBaseHourlyRate(rate: number, rateType: RateType = "DAILY"): number {
  const safeRate = isNaN(rate) || rate < 0 ? 0 : rate;

  if (rateType === "HOURLY") {
    return Number(safeRate.toFixed(2));
  }
  if (rateType === "WEEKLY") {
    // 6 working days a week, 8 hours a day = 48 hours
    return Number(((safeRate / 6) / 8).toFixed(2));
  }
  if (rateType === "MONTHLY") {
    // 26 working days a month, 8 hours a day
    return Number(((safeRate / 26) / 8).toFixed(2));
  }

  // DAILY default: 8 hours
  return Number((safeRate / 8).toFixed(2));
}

/**
 * Calculates the standard Overtime (OT) hourly rate.
 * Uses 1.5x multiplier on the base hourly rate.
 */
export function calculateDefaultOtRate(rate: number, rateType: RateType = "DAILY"): number {
  const baseHourly = calculateBaseHourlyRate(rate, rateType);
  return Number((baseHourly * 1.5).toFixed(2));
}

/**
 * Calculates total OT earnings for given hours and OT hourly rate.
 */
export function calculateOtAmount(otHours: number, otRate: number): number {
  const safeHours = isNaN(otHours) || otHours <= 0 ? 0 : otHours;
  const safeRate = isNaN(otRate) || otRate <= 0 ? 0 : otRate;
  return Number((safeHours * safeRate).toFixed(2));
}

/**
 * Formats OT metadata into a structured tag string for notes.
 * Example: "[OT: 2.0 jam @ RM 15.00/jam = RM 30.00]"
 */
export function formatOtNotes(
  otHours: number,
  otRate: number,
  otAmount: number,
  existingNotes?: string | null
): string {
  const otTag = `[OT: ${otHours.toFixed(1)} jam @ RM ${otRate.toFixed(2)}/jam = RM ${otAmount.toFixed(2)}]`;
  if (!existingNotes || !existingNotes.trim()) {
    return otTag;
  }
  // Remove any previous OT tag to prevent duplicates
  const cleanedNotes = existingNotes.replace(/\[OT:[^\]]*\]/gi, "").trim();
  return cleanedNotes ? `${cleanedNotes} ${otTag}` : otTag;
}

/**
 * Parses structured OT metadata from a notes string.
 * Supports patterns like "[OT: 2.5 jam @ RM 15.00/jam = RM 37.50]" or "[OT: 2.0j @ RM15.00/j = RM30.00]".
 */
export function parseOtFromNotes(
  notes?: string | null
): { otHours: number; otRate: number; otAmount: number; cleanNotes: string } | null {
  if (!notes || typeof notes !== "string") {
    return null;
  }

  const match = notes.match(/\[OT:\s*([\d.]+)\s*(?:j|jam|h|hrs?)?\s*@\s*RM?\s*([\d.]+)\s*(?:\/|sejam|per\s*jam)?\s*=\s*RM?\s*([\d.]+)\]/i);

  if (!match) {
    return null;
  }

  const otHours = parseFloat(match[1]);
  const otRate = parseFloat(match[2]);
  const otAmount = parseFloat(match[3]);

  if (isNaN(otHours) || isNaN(otRate) || isNaN(otAmount)) {
    return null;
  }

  const cleanNotes = notes.replace(match[0], "").trim();

  return {
    otHours: Number(otHours.toFixed(2)),
    otRate: Number(otRate.toFixed(2)),
    otAmount: Number(otAmount.toFixed(2)),
    cleanNotes,
  };
}
