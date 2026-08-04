// Every user of this site is in Nepal, so WhatsApp numbers are collected as
// a fixed +977 prefix plus a 10-digit local number, and always stored (and
// validated) with the country code included — both so wa.me links resolve
// correctly and so old ambiguous "was this already +977?" data can't creep
// back in.
export const NEPAL_PREFIX = "+977";

export function isValidNepaliLocal(local: string): boolean {
  return /^9\d{9}$/.test(local.trim());
}

export function isValidNepaliWhatsapp(full: string): boolean {
  return /^\+977[9]\d{9}$/.test(full.trim());
}

export function toNepaliWhatsapp(local: string): string {
  return `${NEPAL_PREFIX}${local.trim()}`;
}

// Inverse of toNepaliWhatsapp — for pre-filling the local-number input when
// editing a listing that already stored the full +977 form.
export function stripNepaliPrefix(full: string): string {
  return full.trim().startsWith(NEPAL_PREFIX) ? full.trim().slice(NEPAL_PREFIX.length) : full.trim();
}

// For wa.me links / display — strips everything but digits, e.g.
// "+977 9812345678" -> "9779812345678".
export function digitsOnly(whatsapp: string): string {
  return whatsapp.replace(/\D/g, "");
}
