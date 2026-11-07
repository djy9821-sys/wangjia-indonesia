import { randomInt } from "crypto";

/* Alphabet without 0/O/1/I so codes survive being read aloud or typed. */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const generateVerificationCode = (length = 12): string => {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += ALPHABET[randomInt(0, ALPHABET.length)];
  }
  return out;
};

/* WJ-26-000123: brand, two-digit year, running number. */
export const formatSerial = (sequence: number, prefix = "WJ", date = new Date()): string =>
  `${prefix}-${String(date.getFullYear()).slice(-2)}-${String(sequence).padStart(6, "0")}`;

/* The QR label points at the public verification page of the storefront. */
export const warrantyQrUrl = (code: string): string => {
  const base = (process.env.STOREFRONT_URL || "http://localhost:8000").replace(/\/$/, "");
  return `${base}/id/garansi/${code}`;
};

/* Accepts the raw QR content (URL or bare code) and returns the code. */
export const extractWarrantyCode = (raw: string): string | null => {
  const trimmed = raw.trim();
  const m = trimmed.match(/\/garansi\/([A-Z2-9]{8,20})/i) ?? trimmed.match(/^([A-Z2-9]{8,20})$/i);
  return m ? m[1].toUpperCase() : null;
};

export const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
};
