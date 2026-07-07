import { onlyDigits } from "@repo/utils";

export function formatCardNumber(value: string) {
  const digits = onlyDigits(value).slice(0, 16);

  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

export function formatCardExpiration(value: string) {
  const digits = onlyDigits(value).slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export function formatCardCvv(value: string) {
  return onlyDigits(value).slice(0, 4);
}

export function normalizeCardHolderName(value: string) {
  return value.toUpperCase().replace(/\s+/g, " ").trimStart();
}
