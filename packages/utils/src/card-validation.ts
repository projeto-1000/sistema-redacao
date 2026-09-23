import { onlyDigits } from "./format-document";

export interface ParsedCardExpiration {
  month: number;
  year: number;
}

export function isValidCardNumber(value: string) {
  const digits = onlyDigits(value);

  if (digits.length < 13 || digits.length > 19) {
    return false;
  }

  let sum = 0;
  let shouldDouble = false;

  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);

    if (shouldDouble) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

export function parseCardExpiration(
  value: string
): ParsedCardExpiration | null {
  const match = value.match(/^(\d{2})\/(\d{2})$/);

  if (!match) {
    return null;
  }

  const month = Number(match[1]);
  const year = Number(`20${match[2]}`);

  if (month < 1 || month > 12) {
    return null;
  }

  return {
    month,
    year,
  };
}

export function isValidCardExpiration(value: string) {
  const expiration = parseCardExpiration(value);

  if (!expiration) {
    return false;
  }

  const { month, year } = expiration;

  const expirationDate = new Date(year, month, 0, 23, 59, 59);
  const now = new Date();

  return expirationDate >= now;
}

export function isValidCardCvv(value: string) {
  const digits = onlyDigits(value);

  return digits.length === 3;
}