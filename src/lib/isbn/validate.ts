export interface IsbnValidation {
  valid: boolean;
  type: "isbn10" | "isbn13" | "unknown";
}

function isValidIsbn10(digits: string): boolean {
  if (digits.length !== 10) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    const d = parseInt(digits[i], 10);
    if (isNaN(d)) return false;
    sum += d * (10 - i);
  }

  const last = digits[9].toUpperCase();
  sum += last === "X" ? 10 : parseInt(last, 10);
  if (isNaN(sum)) return false;

  return sum % 11 === 0;
}

function isValidIsbn13(digits: string): boolean {
  if (digits.length !== 13) return false;

  let sum = 0;
  for (let i = 0; i < 13; i++) {
    const d = parseInt(digits[i], 10);
    if (isNaN(d)) return false;
    sum += d * (i % 2 === 0 ? 1 : 3);
  }

  return sum % 10 === 0;
}

export function validateIsbn(isbn: string): IsbnValidation {
  const cleaned = isbn.replace(/-/g, "");

  if (cleaned.length === 10) {
    return { valid: isValidIsbn10(cleaned), type: "isbn10" };
  }
  if (cleaned.length === 13) {
    return { valid: isValidIsbn13(cleaned), type: "isbn13" };
  }

  return { valid: false, type: "unknown" };
}
