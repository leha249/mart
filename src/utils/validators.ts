export const isValidHex = (hex: string): boolean => {
  return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
};

export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const isPositiveNumber = (value: string | number): boolean => {
  const n = Number(value);
  return !isNaN(n) && isFinite(n) && n > 0;
};

export const isValidRating = (value: string | number): boolean => {
  const n = Number(value);
  return !isNaN(n) && n >= 0 && n <= 5;
};

export const parseCommaList = (value: string): string[] => {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
};

export const parseHexList = (value: string): string[] => {
  return parseCommaList(value).filter(isValidHex);
};

export const sanitizeText = (value: string): string => {
  return value.trim().replace(/\s+/g, ' ');
};